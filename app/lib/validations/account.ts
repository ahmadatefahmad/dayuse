import { z } from 'zod'
import { EGYPT_MOBILE, normalizeEgyptPhone } from '@/lib/validations/booking'

// Optional Egyptian mobile: empty means "none", anything else must be valid.
const optionalPhone = z
  .string()
  .trim()
  .transform((v) => (v ? normalizeEgyptPhone(v) : ''))
  .refine((v) => v === '' || EGYPT_MOBILE.test(v), 'Enter an Egyptian mobile number, e.g. +20 10 1234 5678')

export const PASSWORD_MIN = 8

export const RegisterSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name').max(120),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters`).max(72),
  phone: optionalPhone,
})

export const ProfileSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your full name').max(120),
    phone: optionalPhone,
    currentPassword: z.string().optional().default(''),
    newPassword: z.string().optional().default(''),
  })
  .refine((v) => !v.newPassword || v.newPassword.length >= PASSWORD_MIN, { message: `Use at least ${PASSWORD_MIN} characters`, path: ['newPassword'] })
  .refine((v) => !v.newPassword || v.currentPassword, { message: 'Enter your current password to set a new one', path: ['currentPassword'] })

export const ReviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.number({ invalid_type_error: 'Choose a rating' }).int().min(1, 'Choose a rating').max(5),
  title: z.string().trim().max(120).optional().default(''),
  body: z.string().trim().min(50, 'Tell us a bit more — at least 50 characters').max(3000),
})

export type RegisterInput = z.input<typeof RegisterSchema>
export type ProfileInput = z.input<typeof ProfileSchema>
export type ReviewInput = z.input<typeof ReviewSchema>
