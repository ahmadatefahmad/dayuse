import { CreditCard, Hotel } from 'lucide-react'
import type { Quote } from '@/lib/pricing'
import { formatEGP, cn } from '@/lib/utils'
import { PLATFORM_FEE_RATE } from '@/lib/pricing'

type Props = {
  quote: Quote
  packageName: string
  guests: { adults: number; children: number; infants: number }
  infantFree: boolean
  addOns: { name: string }[]
  className?: string
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

// The pay-online / pay-on-arrival split is always visible: guests must never be surprised at the hotel.
export function PriceBreakdown({ quote, packageName, guests, infantFree, addOns, className }: Props) {
  const { adults, children, infants } = guests
  return (
    <div className={cn('space-y-3 text-sm', className)}>
      <dl className="space-y-1.5 text-grey-700">
        <Row label={`${packageName} × ${plural(adults, 'adult', 'adults')}`} value={formatEGP(quote.adultsTotal)} />
        {children > 0 && <Row label={`× ${plural(children, 'child', 'children')}`} value={formatEGP(quote.childrenTotal)} />}
        {infants > 0 && <Row label={`× ${plural(infants, 'infant', 'infants')}`} value={infantFree ? 'Free' : formatEGP(quote.infantsTotal)} />}
        {addOns.length > 0 && <Row label={`Add-ons (${addOns.map((a) => a.name).join(', ')})`} value={formatEGP(quote.addOnsTotal)} />}
        {quote.discount > 0 && <Row label="Discount" value={`−${formatEGP(quote.discount)}`} />}
      </dl>
      <div className="flex items-baseline justify-between border-t border-grey-100 pt-3">
        <span className="font-semibold text-navy">Total</span>
        <span className="text-lg font-semibold text-navy">{formatEGP(quote.total)}</span>
      </div>
      <div className="space-y-2 rounded-lg bg-grey-50 p-3">
        <div className="flex items-start justify-between gap-3">
          <span className="flex items-start gap-2 text-navy">
            <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-coral" />
            <span>
              <span className="font-semibold">Pay online now</span>
              <span className="block text-xs text-grey-500">Booking fee ({Math.round(PLATFORM_FEE_RATE * 100)}%)</span>
            </span>
          </span>
          <span className="font-semibold text-coral">{formatEGP(quote.platformFee)}</span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <span className="flex items-start gap-2 text-navy">
            <Hotel className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
            <span>
              <span className="font-semibold">Pay on arrival</span>
              <span className="block text-xs text-grey-500">Directly to the hotel</span>
            </span>
          </span>
          <span className="font-semibold text-navy">{formatEGP(quote.hotelAmount)}</span>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="min-w-0">{label}</dt>
      <dd className="shrink-0 text-navy">{value}</dd>
    </div>
  )
}
