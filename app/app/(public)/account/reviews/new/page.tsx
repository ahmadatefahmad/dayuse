import { redirect } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { findReviewableBooking } from '@/lib/account'
import { requireAuth } from '@/lib/auth'
import { toDateString } from '@/lib/utils'
import { ReviewForm } from '@/components/account/ReviewForm'

export default async function NewReviewPage({ searchParams }: { searchParams: { bookingId?: string } }) {
  const user = await requireAuth(`/account/reviews/new${searchParams.bookingId ? `?bookingId=${searchParams.bookingId}` : ''}`)
  // README rule 3: own booking, confirmed, visit date passed, not already reviewed. Otherwise back to bookings.
  const booking = searchParams.bookingId ? await findReviewableBooking(user.id, searchParams.bookingId) : null
  if (!booking) redirect('/account/bookings?tab=past')

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl text-navy">Review your visit</h2>
      <dl className="my-6 grid gap-4 rounded-xl bg-grey-50 p-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-grey-500">Property</dt>
          <dd className="mt-0.5 font-medium text-navy">{booking.property.name}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-grey-500">Date visited</dt>
          <dd className="mt-0.5 font-medium text-navy">
            {format(parseISO(toDateString(booking.bookingDate)), 'EEEE d MMMM yyyy')} · {booking.package.name}
          </dd>
        </div>
      </dl>
      <ReviewForm bookingId={booking.id} />
    </div>
  )
}
