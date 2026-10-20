import { z } from 'zod'
import { GUEST_LIMITS } from '@/lib/pricing'

// Egyptian mobile in E.164: +20 then 10, 11, 12 or 15 and eight digits.
export const EGYPT_MOBILE = /^\+201[0125]\d{8}$/

// Accepts "010 1234 5678", "01012345678", "00201012345678", "+20 101 234 5678"…
export function normalizeEgyptPhone(value: string) {
  let v = value.replace(/[\s\-().]/g, '')
  if (v.startsWith('00')) v = `+${v.slice(2)}`
  if (/^01\d{9}$/.test(v)) v = `+2${v}`
  if (/^201\d{9}$/.test(v)) v = `+${v}`
  return v
}

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date')

export const BookingSelectionSchema = z.object({
  propertyId: z.string().min(1),
  packageId: z.string().min(1),
  date: dateString,
  adults: z.number().int().min(1).max(GUEST_LIMITS.adults * 5),
  children: z.number().int().min(0).max(GUEST_LIMITS.children * 5),
  infants: z.number().int().min(0).max(GUEST_LIMITS.infants),
  addOnIds: z.array(z.string()).max(30).default([]),
})

export const GuestDetailsSchema = z.object({
  guestName: z.string().trim().min(2, 'Enter your full name').max(120),
  guestEmail: z.string().trim().toLowerCase().email('Enter a valid email address'),
  guestPhone: z
    .string()
    .transform(normalizeEgyptPhone)
    .pipe(z.string().regex(EGYPT_MOBILE, 'Enter an Egyptian mobile number, e.g. +20 10 1234 5678')),
  specialRequests: z.string().trim().max(1000).optional(),
})

export const CreateBookingSchema = BookingSelectionSchema.merge(GuestDetailsSchema).extend({
  couponCode: z.string().trim().toUpperCase().max(40).nullish(),
})

export const CouponValidateSchema = z.object({
  code: z.string().trim().min(1).max(40),
  totalPrice: z.number().nonnegative(),
})

export const BookingActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('cancel'), token: z.string().optional() }),
  z.object({ action: z.literal('change'), token: z.string().optional(), newDate: dateString, newPackageId: z.string().optional() }),
])

export type GuestDetailsInput = z.input<typeof GuestDetailsSchema>
export type CreateBookingInput = z.input<typeof CreateBookingSchema>
