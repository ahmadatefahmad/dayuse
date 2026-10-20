import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { Ban, Building2, CalendarCheck, CalendarDays, Star, Wallet } from 'lucide-react'
import { getDashboardStats } from '@/lib/admin/stats'
import { bookingReference } from '@/lib/booking-format'
import { formatCairoDateTime, formatEGP, toDateString } from '@/lib/utils'
import { BookingsChart } from '@/components/admin/BookingsChart'
import { BookingStatusPill } from '@/components/admin/BookingStatusPill'
import { KpiCard } from '@/components/admin/KpiCard'
import { PageHeader } from '@/components/admin/PageHeader'
import { buttonClasses } from '@/components/ui/Button'

export default async function DashboardPage() {
  const s = await getDashboardStats()

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Cairo time. Bookings count from when they were made; unpaid checkouts are excluded."
        actions={
          <Link href="/admin/properties/new" className={buttonClasses()}>
            Add property
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard title="Today's bookings" value={s.todayBookings} icon={CalendarCheck} />
        <KpiCard title="This month's revenue" value={formatEGP(s.monthRevenue)} icon={Wallet} hint="Booking fees kept (excludes refunds)" />
        <KpiCard title="This month's bookings" value={s.monthBookings} icon={CalendarDays} />
        <KpiCard title="Cancellation rate" value={s.cancellationRate === null ? '—' : `${Math.round(s.cancellationRate * 100)}%`} icon={Ban} hint="Cancelled ÷ bookings made this month" />
        <KpiCard title="Active properties" value={s.activeProperties} icon={Building2} />
        <Link href="/admin/reviews" className="rounded-xl transition-shadow hover:shadow-md">
          <KpiCard title="Pending reviews" value={s.pendingReviews} icon={Star} hint={s.pendingReviews ? 'Waiting for moderation →' : 'All caught up'} />
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <BookingsChart data={s.bookingsPerDay} />

        <section className="rounded-xl border border-grey-100 bg-white p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-lg text-navy">Recent bookings</h2>
            <Link href="/admin/bookings" className="text-sm text-coral hover:underline">
              View all
            </Link>
          </div>
          {s.recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-grey-500">No bookings yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap text-left text-sm">
                <tbody className="divide-y divide-grey-100">
                  {s.recent.map((b) => (
                    <tr key={b.id}>
                      <td className="py-2 pr-3">
                        <Link href={`/admin/bookings/${b.id}`} className="font-medium text-coral hover:underline">
                          {bookingReference(b.id)}
                        </Link>
                        <p className="text-xs text-grey-500">{formatCairoDateTime(b.createdAt, false)}</p>
                      </td>
                      <td className="max-w-[160px] truncate py-2 pr-3 text-navy">{b.guestName}</td>
                      <td className="max-w-[160px] truncate py-2 pr-3 text-grey-700">
                        {b.property.name}
                        <p className="text-xs text-grey-500">{format(parseISO(toDateString(b.bookingDate)), 'd MMM yyyy')}</p>
                      </td>
                      <td className="py-2 pr-3 text-right text-navy">{formatEGP(b.totalPrice)}</td>
                      <td className="py-2 text-right">
                        <BookingStatusPill status={b.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  )
}
