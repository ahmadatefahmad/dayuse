'use client'

import { useBooking, useBookingData, useQuote } from '@/components/booking/BookingProvider'
import { formatEGP } from '@/lib/utils'

// On phones the booking panel sits below the content; this bar keeps price + CTA in reach.
export function MobileBookingBar() {
  const { bookable } = useBookingData()
  const date = useBooking((s) => s.date)
  const { price, quote } = useQuote()

  if (!bookable) return null
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-grey-100 bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(13,27,42,0.08)] lg:hidden">
      <div className="text-sm">
        {date ? (
          <>
            <p className="font-semibold text-navy">{formatEGP(quote.total)} total</p>
            <p className="text-xs text-grey-500">{formatEGP(quote.platformFee)} online · rest on arrival</p>
          </>
        ) : (
          <p className="text-grey-500">
            From <span className="font-semibold text-navy">{formatEGP(price.adultPrice)}</span> / adult
          </p>
        )}
      </div>
      <a href="#book" className="rounded-lg bg-coral px-5 py-2.5 text-sm font-semibold text-white">
        {date ? 'Review & book' : 'Check dates'}
      </a>
    </div>
  )
}
