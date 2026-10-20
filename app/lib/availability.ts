import prisma from '@/lib/prisma'
import { resolvePrice, type PriceRule } from '@/lib/pricing'
import { fromDateString, isDateString, toDateString, todayInEgypt } from '@/lib/utils'

// Bookings that hold capacity. Pending bookings (payment not completed) don't.
export const CAPACITY_STATUSES = ['confirmed', 'completed']

export type Availability = {
  available: boolean
  isBlackout: boolean
  spotsLeft: number | null
  reason?: 'invalid_date' | 'past' | 'not_found' | 'blackout' | 'not_configured' | 'full'
}

// README rules 2 and 5: blackout dates are hard blocks; otherwise confirmed adults for
// the date must stay under the property's adult capacity.
// excludeBookingId: ignore a booking's own spots, e.g. when it is being moved to another date.
export async function checkAvailability(propertyId: string, date: string, adults = 1, excludeBookingId?: string): Promise<Availability> {
  const closed = (reason: Availability['reason'], extra: Partial<Availability> = {}) => ({ available: false, isBlackout: false, spotsLeft: null, reason, ...extra })
  if (!isDateString(date)) return closed('invalid_date')
  if (date < todayInEgypt()) return closed('past')

  const day = fromDateString(date)
  const property = await prisma.property.findFirst({
    where: { id: propertyId, active: true },
    select: {
      availabilityWindows: { select: { maxCapacityAdults: true }, take: 1 },
      blackoutDates: { where: { date: day }, select: { id: true } },
    },
  })
  if (!property) return closed('not_found')
  if (property.blackoutDates.length) return closed('blackout', { isBlackout: true })
  const window = property.availabilityWindows[0]
  if (!window) return closed('not_configured')

  const booked = await prisma.booking.aggregate({
    where: { propertyId, bookingDate: day, status: { in: CAPACITY_STATUSES }, ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}) },
    _sum: { adults: true },
  })
  const spotsLeft = Math.max(window.maxCapacityAdults - (booked._sum.adults ?? 0), 0)
  const available = spotsLeft >= Math.max(adults, 1)
  return { available, isBlackout: false, spotsLeft, ...(available ? {} : { reason: 'full' as const }) }
}

export async function getPriceRules(propertyId: string): Promise<PriceRule[]> {
  const rules = await prisma.propertyPricing.findMany({ where: { propertyId } })
  return rules.map((r) => ({
    packageId: r.packageId,
    dayOfWeek: r.dayOfWeek,
    date: r.dateOverride ? toDateString(r.dateOverride) : null,
    adultPrice: r.adultPrice,
    childPrice: r.childPrice,
  }))
}

// Adult and child price for a package on a date. Null if the package isn't bookable.
export async function getPricing(propertyId: string, packageId: string, date?: string | null) {
  const pkg = await prisma.package.findFirst({
    where: { id: packageId, propertyId, active: true },
    select: { id: true, adultPrice: true, childPrice: true },
  })
  if (!pkg) return null
  return resolvePrice(pkg, await getPriceRules(propertyId), isDateString(date) ? date : null)
}
