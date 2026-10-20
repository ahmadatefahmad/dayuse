import prisma from '@/lib/prisma'
import { checkAvailability, getPriceRules } from '@/lib/availability'
import { calculateQuote, GUEST_LIMITS, resolvePrice } from '@/lib/pricing'

export class BookingError extends Error {
  constructor(message: string, public status = 400) {
    super(message)
  }
}

export type BookingSelection = {
  propertyId: string
  packageId: string
  date: string
  adults: number
  children: number
  infants: number
  addOnIds: string[]
}

export type AddOnLine = { addOnId: string; name: string; price: number; perPerson: boolean; qty: number; total: number }

const UNAVAILABLE: Record<string, string> = {
  invalid_date: 'Please choose a valid date.',
  past: 'That date has already passed.',
  not_found: 'This property isn’t available for booking.',
  blackout: 'The property is closed to day guests on that date.',
  not_configured: 'This property isn’t taking bookings yet.',
  full: 'Not enough spots left on that date for your party.',
}

// Server-side source of truth for a booking's price. Re-validates everything the browser sent.
export async function priceBooking(sel: BookingSelection, opts: { discount?: number; excludeBookingId?: string } = {}) {
  const pkg = await prisma.package.findFirst({
    where: { id: sel.packageId, propertyId: sel.propertyId, active: true, property: { active: true } },
    include: { addOns: { where: { active: true } }, property: { select: { id: true, name: true } } },
  })
  if (!pkg) throw new BookingError('This package isn’t available.', 404)

  if (sel.adults < 1) throw new BookingError('At least one adult is required.')
  if (sel.adults > (pkg.maxAdults ?? GUEST_LIMITS.adults)) throw new BookingError(`This package allows up to ${pkg.maxAdults ?? GUEST_LIMITS.adults} adults.`)
  if (sel.children > (pkg.maxChildren ?? GUEST_LIMITS.children)) throw new BookingError(`This package allows up to ${pkg.maxChildren ?? GUEST_LIMITS.children} children.`)
  if (sel.infants > GUEST_LIMITS.infants) throw new BookingError(`Up to ${GUEST_LIMITS.infants} infants per booking.`)

  const uniqueAddOnIds = Array.from(new Set(sel.addOnIds))
  const addOns = uniqueAddOnIds.map((id) => pkg.addOns.find((a) => a.id === id))
  if (addOns.some((a) => !a)) throw new BookingError('One of the selected extras is no longer available.')

  const availability = await checkAvailability(sel.propertyId, sel.date, sel.adults, opts.excludeBookingId)
  if (!availability.available) throw new BookingError(UNAVAILABLE[availability.reason ?? ''] ?? 'Not available on that date.', 409)

  const price = resolvePrice(pkg, await getPriceRules(sel.propertyId), sel.date)
  const chosen = addOns.filter((a): a is NonNullable<typeof a> => Boolean(a))
  const quote = calculateQuote({ ...price, infantFree: pkg.infantFree, adults: sel.adults, children: sel.children, infants: sel.infants, addOns: chosen, discount: opts.discount })

  const payingGuests = sel.adults + sel.children + (pkg.infantFree ? 0 : sel.infants)
  const addOnLines: AddOnLine[] = chosen.map((a) => {
    const qty = a.perPerson ? payingGuests : 1
    return { addOnId: a.id, name: a.name, price: a.price, perPerson: a.perPerson, qty, total: a.price * qty }
  })

  return { property: pkg.property, pkg: { id: pkg.id, name: pkg.name, infantFree: pkg.infantFree }, price, quote, addOnLines, availability }
}
