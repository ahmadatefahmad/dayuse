import { z } from 'zod'

export const MAX_FIXED_DISCOUNT = 100_000 // EGP — a typo guard, not a business rule

const optionalNumber = (schema: z.ZodNumber) => z.preprocess((v) => (v === '' || v === null || v === undefined || Number.isNaN(v) ? null : v), schema.nullable())

export const CouponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,30}$/, '3–30 characters: letters, numbers, - or _'),
    type: z.enum(['percent', 'fixed']),
    value: z.number({ invalid_type_error: 'Enter a value' }).positive('Must be more than 0'),
    minBookingTotal: optionalNumber(z.number().nonnegative()),
    maxUses: optionalNumber(z.number().int().min(1, 'At least 1')),
    expiresAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable()
      .optional()
      .or(z.literal('').transform(() => null)),
    active: z.boolean().default(true),
  })
  .superRefine((c, ctx) => {
    if (c.type === 'percent' && c.value > 100) ctx.addIssue({ code: 'custom', path: ['value'], message: 'A percentage can be at most 100' })
    if (c.type === 'fixed' && c.value > MAX_FIXED_DISCOUNT) ctx.addIssue({ code: 'custom', path: ['value'], message: `At most EGP ${MAX_FIXED_DISCOUNT.toLocaleString('en')}` })
  })

export type CouponInput = z.input<typeof CouponSchema>
export type CouponOutput = z.output<typeof CouponSchema>

// Easy to read aloud: no 0/O or 1/I.
export function suggestCouponCode(prefix = 'DAY') {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(5))
  return prefix + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}
