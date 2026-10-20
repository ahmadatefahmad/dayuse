import { z } from 'zod'

export const PROPERTY_TYPES = ['hotel', 'beach_club', 'resort'] as const
export const PROPERTY_TYPE_LABELS: Record<(typeof PROPERTY_TYPES)[number], string> = {
  hotel: 'Hotel',
  beach_club: 'Beach club',
  resort: 'Resort',
}
export const CITIES = ['Hurghada', 'Cairo', 'Sharm el Sheikh', 'Alexandria', 'Ain Sokhna'] as const
export const AMENITIES = ['Pool', 'Private Beach', 'WiFi', 'Restaurant', 'Spa', 'Gym', 'Kids Area', 'Parking'] as const
export const MAX_IMAGES = 12

// URL-friendly slugs for cities and amenities, e.g. ?city=sharm-el-sheikh&amenities=pool,private-beach
const toSlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
export const citySlug = toSlug
export const cityFromSlug = (slug?: string | null) => CITIES.find((c) => toSlug(c) === slug)
export const amenitySlug = toSlug
export const amenityFromSlug = (slug: string) => AMENITIES.find((a) => toSlug(a) === slug)

export const PropertySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and dashes only'),
  type: z.enum(PROPERTY_TYPES),
  city: z.string().min(1),
  area: z.string().nullish(),
  stars: z.number().int().min(1).max(5).nullish(),
  address: z.string().min(5),
  description: z.string().min(20, 'Write at least 20 characters'),
  amenities: z.array(z.string()),
  images: z.array(z.string().url()).max(MAX_IMAGES),
  coverImage: z.string().url('Add a cover image'),
  active: z.boolean().default(true),
})
export const PropertyUpdateSchema = PropertySchema.partial()

const optionalCount = z.number().int().positive().nullish()
// Empty number inputs arrive as undefined or NaN; give both the same friendly message.
const num = (message: string) => z.number({ required_error: message, invalid_type_error: message })

export const PackageSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10, 'Write at least 10 characters'),
  inclusions: z.array(z.string()),
  adultPrice: num('Enter a price').positive(),
  childPrice: num('Enter a price').nonnegative(),
  infantFree: z.boolean().default(true),
  maxAdults: optionalCount,
  maxChildren: optionalCount,
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  addOns: z.array(z.object({
    id: z.string().optional(), // present when editing an existing add-on
    name: z.string().min(1, 'Name required'),
    price: num('Enter a price').nonnegative(),
    perPerson: z.boolean().default(true),
    active: z.boolean().default(true),
  })),
})

const price = z.number().nonnegative()
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM')

function unique<T>(key: (item: T) => unknown) {
  return (items: T[]) => new Set(items.map(key)).size === items.length
}

export const PricingSchema = z.object({
  packageId: z.string().min(1),
  days: z
    .array(z.object({ dayOfWeek: z.number().int().min(0).max(6), adultPrice: price, childPrice: price }))
    .refine(unique((d) => d.dayOfWeek), 'Each day can only appear once'),
  overrides: z
    .array(z.object({ date: dateString, adultPrice: price, childPrice: price }))
    .refine(unique((o) => o.date), 'Each date can only have one override'),
})

export const AvailabilitySchema = z
  .object({
    startTime: time,
    endTime: time,
    maxCapacityAdults: num('Enter a number').int().positive(),
    maxCapacityChildren: num('Enter a number').int().nonnegative(),
    blackoutDates: z
      .array(z.object({ date: dateString, reason: z.string().nullish() }))
      .refine(unique((b) => b.date), 'Each blackout date can only appear once'),
  })
  .refine((d) => d.startTime < d.endTime, { message: 'End time must be after start time', path: ['endTime'] })

export type PropertyInput = z.input<typeof PropertySchema>
export type PackageInput = z.input<typeof PackageSchema>
export type PricingInput = z.input<typeof PricingSchema>
export type AvailabilityInput = z.input<typeof AvailabilitySchema>
export type PropertyOutput = z.output<typeof PropertySchema>
export type PackageOutput = z.output<typeof PackageSchema>
export type AvailabilityOutput = z.output<typeof AvailabilitySchema>
