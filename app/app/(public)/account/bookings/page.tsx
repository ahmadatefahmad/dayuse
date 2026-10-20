import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { PenLine } from 'lucide-react'
import { BOOKING_TABS, canReview, listUserBookings, type BookingTab } from '@/lib/account'
import { requireAuth } from '@/lib/auth'
import { cn, formatEGP, toDateString, todayInEgypt } from '@/lib/utils'
import { BookingStatusBadge } from '@/components/account/BookingStatusBadge'
import { ManageBooking } from '@/components/booking/BookingActions'
import { PropertyImage } from '@/components/property/PropertyImage'
import { buttonClasses } from '@/components/ui/Button'

const LABELS: Record<BookingTab, string> = { upcoming: 'Upcoming', past: 'Past', cancelled: 'Cancelled' }
const EMPTY: Record<BookingTab, string> = {
  upcoming: 'No upcoming day passes. Time to plan your next escape?',
  past: 'Your past visits will appear here.',
  cancelled: 'No cancelled bookings.',
}

export default async function AccountBookingsPage({ searchParams }: { searchParams: { tab?: string } }) {
  const user = await requireAuth('/account/bookings')
  const tab: BookingTab = BOOKING_TABS.find((t) => t === searchParams.tab) ?? 'upcoming'
  const bookings = await listUserBookings(user.id, tab)
  const today = todayInEgypt()

  return (
    <div>
      <div className="mb-6 inline-flex rounded-lg bg-grey-100 p-1">
        {BOOKING_TABS.map((t) => (
          <Link
            key={t}
            href={t === 'upcoming' ? '/account/bookings' : `/account/bookings?tab=${t}`}
            className={cn('rounded-md px-4 py-1.5 text-sm font-medium transition-colors', t === tab ? 'bg-white text-navy shadow-sm' : 'text-grey-500 hover:text-navy')}
          >
            {LABELS[t]}
          </Link>
        ))}
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-grey-300 bg-white p-12 text-center">
          <p className="text-grey-500">{EMPTY[tab]}</p>
          {tab === 'upcoming' && (
            <Link href="/search" className={buttonClasses('primary', 'md', 'mt-6')}>
              Explore day passes
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-4">
          {bookings.map((b) => {
            const date = toDateString(b.bookingDate)
            const upcoming = b.status === 'confirmed' && date >= today
            return (
              <li key={b.id} className="flex flex-col gap-4 overflow-hidden rounded-xl border border-grey-100 bg-white sm:flex-row">
                <div className="relative h-36 w-full shrink-0 sm:h-auto sm:w-44">
                  <PropertyImage src={b.property.coverImage} alt="" sizes="(min-width: 640px) 176px, 100vw" />
                </div>
                <div className="flex-1 space-y-3 p-4 sm:pl-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl text-navy">{b.property.name}</h2>
                      <p className="text-sm text-grey-500">{b.package.name}</p>
                    </div>
                    <BookingStatusBadge status={b.status} isPast={date < today} />
                  </div>
                  <p className="text-sm text-navy">
                    <strong>{format(parseISO(date), 'EEE d MMM yyyy')}</strong>
                    <span className="text-grey-500">
                      {' '}
                      · Adults: {b.adults}
                      {b.children > 0 && ` | Children: ${b.children}`}
                      {b.infants > 0 && ` | Infants: ${b.infants}`}
                    </span>
                  </p>
                  <p className="text-sm text-grey-700">
                    Total: <strong className="text-navy">{formatEGP(b.totalPrice)}</strong> <span className="text-grey-300">·</span> Paid online: {formatEGP(b.platformFee)}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Link href={`/account/bookings/${b.id}`} className={buttonClasses('secondary', 'sm')}>
                      View details
                    </Link>
                    {canReview(b) && (
                      <Link href={`/account/reviews/new?bookingId=${b.id}`} className={buttonClasses('primary', 'sm')}>
                        <PenLine className="h-3.5 w-3.5" /> Write review
                      </Link>
                    )}
                    {upcoming && <ManageBooking bookingId={b.id} token={null} canChange={false} canCancel compact />}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
