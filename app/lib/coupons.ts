import prisma from '@/lib/prisma'
import { couponDiscount } from '@/lib/pricing'

export type CouponCheck =
  | { valid: true; code: string; discount: number; finalPrice: number }
  | { valid: false; reason: string }

export async function validateCoupon(code: string, totalPrice: number): Promise<CouponCheck> {
  const coupon = await prisma.coupon.findFirst({ where: { code: { equals: code.trim(), mode: 'insensitive' }, active: true } })
  if (!coupon) return { valid: false, reason: 'This code isn’t valid.' }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { valid: false, reason: 'This code has expired.' }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) return { valid: false, reason: 'This code has reached its usage limit.' }
  if (coupon.minBookingTotal != null && totalPrice < coupon.minBookingTotal) {
    return { valid: false, reason: `This code needs a booking total of at least EGP ${coupon.minBookingTotal.toLocaleString('en')}.` }
  }
  const discount = couponDiscount(coupon, totalPrice)
  return { valid: true, code: coupon.code, discount, finalPrice: totalPrice - discount }
}

// Called when a booking's payment is confirmed (not at checkout, so abandoned carts don't use it up).
export async function redeemCoupon(code: string | null) {
  if (!code) return
  await prisma.coupon.updateMany({ where: { code: { equals: code, mode: 'insensitive' } }, data: { usedCount: { increment: 1 } } })
}
