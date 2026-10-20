import { NextResponse, type NextRequest } from 'next/server'
import { handleApiError } from '@/lib/api'
import { validateCoupon } from '@/lib/coupons'
import { CouponValidateSchema } from '@/lib/validations/booking'

// POST { code, totalPrice } -> { valid: true, code, discount, finalPrice } | { valid: false, reason }
export async function POST(request: NextRequest) {
  try {
    const { code, totalPrice } = CouponValidateSchema.parse(await request.json())
    return NextResponse.json(await validateCoupon(code, totalPrice))
  } catch (err) {
    return handleApiError(err)
  }
}
