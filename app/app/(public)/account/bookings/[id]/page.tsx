import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, Check, Circle, PenLine, X } from 'lucide-react'
import { canReview, getUserBooking } from '@/lib/account'
import { requireAuth } from '@/lib/auth'
import { bookingReference, formatLocation, guestSummary } from '@/lib/booking-format'
import type { AddOnLine } from '@/lib/booking-quote'
import { cn, formatEGP, toDateString, todayInEgypt } from '@/lib/utils'
import { BookingStatusBadge } from '@/components/account/BookingStatusBadge'
import { ManageBooking } from '@/components/booking/BookingActions'
import { PropertyImage } from '@/components/property/PropertyImage'
import { buttonClasses } from '@/components/ui/Button'

type Step = { label: string; detail?: string; state: 'done' | 'current' | 'todo' | 'cancelled' }

export default async function AccountBookingPage({ params }: { params: { id: string } }) {
  const user = await requireAuth(`/account/bookings/${params.id}`)
  const b = await getUserBooking(user.id, params.id)
  if (!b) notFound()

  const date = toDateString(b.bookingDate)
  const today = todayInEgypt()
  const visited = date < today
  const addOns = (b.addOns as AddOnLine[] | null) ?? []
  const fmt = (d: Date) => format(d, 'd MMM yyyy, HH:mm')

  // placed → confirmed → completed (or → cancelled), with any changes in between.
  const steps: Step[] = [{ label: 'Booking placed', detail: fmt(b.createdAt), state: 'done' }]
  if (b.status === 'pending') steps.push({ label: 'Awaiting payment confirmation', state: 'current' })
  else steps.push({ label: 'Confirmed', detail: b.platformFee > 0 ? `${formatEGP(b.platformFee)} booking fee paid` : 'No online payment needed', state: 'done' })
  for (const c of b.changeHistory) {
    const diff = c.priceDiff > 0 ? `, ${formatEGP(c.priceDiff)} charged` : c.priceDiff < 0 ? `, ${formatEGP(-c.priceDiff)} refunded` : ''
    steps.push({ label: 'Changed', detail: `${fmt(c.changedAt)} — moved to ${c.newDate ? format(parseISO(toDateString(c.newDate)), 'd MMM yyyy') : '—'}${diff}`, state: 'done' })
  }
  if (b.status === 'cancelled') steps.push({ label: 'Cancelled', detail: `${fmt(b.updatedAt)}${b.platformFee > 0 ? ` — ${formatEGP(b.platformFee)} refunded` : ''}`, state: 'cancelled' })
  else if (b.status !== 'pending') steps.push({ label: visited ? 'Visited' : 'Your day out', detail: format(parseISO(date), 'EEEE d MMMM yyyy'), state: visited || b.status === 'completed' ? 'done' : 'todo' })

  return (
    <div className="space-y-8">
      <Link href="/account/bookings" className="inline-flex items-center gap-1 text-sm text-grey-500 hover:text-navy">
        <ArrowLeft className="h-4 w-4" /> All bookings
      </Link>

      <div className="flex flex-col gap-6 overflow-hidden rounded-xl border border-grey-100 bg-white sm:flex-row">
        <div className="relative h-44 w-full shrink-0 sm:h-auto sm:w-64">
          <PropertyImage src={b.property.coverImage} alt="" sizes="(min-width: 640px) 256px, 100vw" />
        </div>
        <div className="flex-1 space-y-2 p-5 sm:pl-0">
          <div className="flex items-start justify-between gap-3">
            <Link href={`/property/${b.property.id}`} className="font-playfair text-2xl text-navy hover:underline">
              {b.property.name}
            </Link>
            <BookingStatusBadge status={b.status} isPast={visited} />
          </div>
          <p className="text-sm text-grey-500">{formatLocation(b.property.address, b.property.area, b.property.city)}</p>
          <p className="text-sm text-navy">
            Reference <strong>{bookingReference(b.id)}</strong>
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-grey-100 bg-white p-5">
          <h2 className="mb-4 text-lg text-navy">Details</h2>
          <dl className="space-y-2 text-sm">
            {[
              ['Date', format(parseISO(date), 'EEEE d MMMM yyyy')],
              ['Hours', b.property.availabilityWindows[0] ? `${b.property.availabilityWindows[0].startTime}–${b.property.availabilityWindows[0].endTime}` : '—'],
              ['Package', b.package.name],
              ['Guests', guestSummary(b)],
              ['Extras', addOns.length ? addOns.map((a) => (a.qty > 1 ? `${a.name} × ${a.qty}` : a.name)).join(', ') : 'None'],
              ['Lead guest', b.guestName],
              ...(b.specialRequests ? [['Requests', b.specialRequests]] : []),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-grey-500">{k}</dt>
                <dd className="text-right text-navy">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-xl border border-grey-100 bg-white p-5">
          <h2 className="mb-4 text-lg text-navy">Payment</h2>
          <dl className="space-y-2 text-sm">
            {b.discountAmount > 0 && (
              <div className="flex justify-between">
                <dt className="text-grey-500">Discount{b.couponCode ? ` (${b.couponCode})` : ''}</dt>
                <dd className="text-navy">−{formatEGP(b.discountAmount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="font-semibold text-navy">Total</dt>
              <dd className="font-semibold text-navy">{formatEGP(b.totalPrice)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-grey-500">Paid online (booking fee)</dt>
              <dd className="text-navy">{formatEGP(b.platformFee)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-grey-500">{b.status === 'cancelled' ? 'Was due at the hotel' : 'Pay on arrival'}</dt>
              <dd className="font-semibold text-teal">{formatEGP(b.hotelAmount)}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="rounded-xl border border-grey-100 bg-white p-5">
        <h2 className="mb-4 text-lg text-navy">Timeline</h2>
        <ol className="space-y-4">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span
                className={cn(
                  'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                  s.state === 'done' && 'bg-teal text-white',
                  s.state === 'current' && 'bg-coral text-white',
                  s.state === 'todo' && 'border-2 border-grey-300 text-grey-300',
                  s.state === 'cancelled' && 'bg-grey-500 text-white',
                )}
              >
                {s.state === 'done' ? <Check className="h-3.5 w-3.5" /> : s.state === 'cancelled' ? <X className="h-3.5 w-3.5" /> : <Circle className="h-2 w-2 fill-current" />}
              </span>
              <div>
                <p className={cn('text-sm font-medium', s.state === 'todo' ? 'text-grey-500' : 'text-navy')}>{s.label}</p>
                {s.detail && <p className="text-xs text-grey-500">{s.detail}</p>}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        {b.status === 'confirmed' && <ManageBooking bookingId={b.id} token={null} canChange={date > today} canCancel={date >= today} />}
        {canReview(b) && (
          <Link href={`/account/reviews/new?bookingId=${b.id}`} className={buttonClasses('primary')}>
            <PenLine className="h-4 w-4" /> Write a review
          </Link>
        )}
        {b.reviews.length > 0 && <p className="text-sm text-grey-500">You reviewed this visit — see it under Reviews.</p>}
        <Link href={`/booking/${b.id}`} className={buttonClasses('ghost')}>
          Show confirmation
        </Link>
      </div>
    </div>
  )
}
