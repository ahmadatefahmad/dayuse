// Pure price maths shared by the booking panel (client) and booking creation (server),
// so the guest always sees exactly what they'll be charged. No server-only imports here.
import { fromDateString } from '@/lib/utils'

// Share of the total charged online by DayUse; the hotel collects the rest on arrival.
export const PLATFORM_FEE_RATE = 0.15

// Party-size limits when a package doesn't set its own.
export const GUEST_LIMITS = { adults: 20, children: 10, infants: 5 }

// Coupon discount on a total (README rule 8: applied before the fee split).
export function couponDiscount(coupon: { type: string; value: number }, total: number) {
  const raw = coupon.type === 'percent' ? Math.round((total * coupon.value) / 100) : coupon.value
  return Math.min(Math.max(raw, 0), total)
}

export type PriceRule = {
  packageId: string | null
  dayOfWeek: number | null // 0 = Sunday
  date: string | null // YYYY-MM-DD date override
  adultPrice: number
  childPrice: number
}

type PackagePrices = { id: string; adultPrice: number; childPrice: number }

// README rule 9: a date override wins, then the day-of-week price, then the package base price.
export function resolvePrice(pkg: PackagePrices, rules: PriceRule[], date?: string | null) {
  if (date) {
    const own = rules.filter((r) => r.packageId === pkg.id)
    const override = own.find((r) => r.date === date)
    if (override) return { adultPrice: override.adultPrice, childPrice: override.childPrice, source: 'override' as const }
    const dow = fromDateString(date).getUTCDay()
    const day = own.find((r) => r.dayOfWeek === dow)
    if (day) return { adultPrice: day.adultPrice, childPrice: day.childPrice, source: 'day' as const }
  }
  return { adultPrice: pkg.adultPrice, childPrice: pkg.childPrice, source: 'base' as const }
}

export type QuoteInput = {
  adultPrice: number
  childPrice: number
  infantFree: boolean
  adults: number
  children: number
  infants: number
  addOns: { price: number; perPerson: boolean }[]
  discount?: number
}

export type Quote = ReturnType<typeof calculateQuote>

export function calculateQuote(input: QuoteInput) {
  const infantPrice = input.infantFree ? 0 : input.childPrice
  const adultsTotal = input.adultPrice * input.adults
  const childrenTotal = input.childPrice * input.children
  const infantsTotal = infantPrice * input.infants
  const packageTotal = adultsTotal + childrenTotal + infantsTotal

  // Per-person add-ons are charged for every paying guest (infants who go free are excluded).
  const payingGuests = input.adults + input.children + (input.infantFree ? 0 : input.infants)
  const addOnsTotal = input.addOns.reduce((sum, a) => sum + (a.perPerson ? a.price * payingGuests : a.price), 0)

  const subtotal = packageTotal + addOnsTotal
  // README rule 8: coupons come off the total before the fee split.
  const discount = Math.min(Math.max(input.discount ?? 0, 0), subtotal)
  const total = subtotal - discount
  const platformFee = Math.round(total * PLATFORM_FEE_RATE)

  return { adultsTotal, childrenTotal, infantsTotal, packageTotal, addOnsTotal, subtotal, discount, total, platformFee, hotelAmount: total - platformFee }
}
