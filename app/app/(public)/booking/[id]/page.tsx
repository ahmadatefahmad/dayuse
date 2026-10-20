import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { CheckCircle2, Clock, Hotel, LoaderCircle, MapPin, XCircle } from 'lucide-react'
import prisma from '@/lib/prisma'
import { canAccessBooking } from '@/lib/booking-access'
import { bookingReference, formatLocation, guestSummary } from '@/lib/booking-format'
import type { AddOnLine } from '@/lib/booking-quote'
import { formatEGP, toDateString, todayInEgypt } from '@/lib/utils'
import { AddToCalendar, ManageBooking, PendingRefresher } from '@/components/booking/BookingActions'
import { PropertyImage } from '@/components/property/PropertyImage'
import { buttonClasses } from '@/components/ui/Button'

export const metadata = { title: 'Your booking — DayUse Egypt', robots: { index: false } }
export const dynamic = 'force-dynamic'

type Props = { params: { id: string }; searchParams: { t?: string; payment_intent?: string } }

export default async function BookingPage({ params, searchParams }: Props) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      property: { select: { id: true, name: true, coverImage: true, city: true, area: true, address: true, availabilityWindows: { take: 1 } } },
      package: { select: { name: true, inclusions: true } },
    },
  })
  // Unknown and not-yours look identical, so booking ids can't be probed.
  if (!booking || !(await canAccessBooking(booking, searchParams.t))) notFound()

  const token = searchParams.t ?? null
  const date = toDateString(booking.bookingDate)
  const today = todayInEgypt()
  const window = booking.property.availabilityWindows[0]
  const location = formatLocation(booking.property.address, booking.property.area, booking.property.city)
  const addOns = (booking.addOns as AddOnLine[] | null) ?? []
  const ref = bookingReference(booking.id)
  const confirmed = booking.status === 'confirmed' || booking.status === 'completed'

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="text-center">
        {booking.status === 'pending' ? (
          <>
            <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-coral" />
            <h1 className="mt-4 text-3xl text-navy sm:text-4xl">Confirming your payment…</h1>
            <p className="mt-2 text-grey-500">This usually takes a few seconds. You can keep this page open.</p>
            <div className="mt-3">
              <PendingRefresher />
            </div>
          </>
        ) : booking.status === 'cancelled' ? (
          <>
            <XCircle className="mx-auto h-12 w-12 text-grey-500" />
            <h1 className="mt-4 text-3xl text-navy sm:text-4xl">Booking cancelled</h1>
            <p className="mt-2 text-grey-500">
              {booking.platformFee > 0 ? `Your booking fee of ${formatEGP(booking.platformFee)} is being refunded to your card. It can take 5–10 days to appear.` : 'Nothing was charged online.'}
            </p>
          </>
        ) : (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-teal" />
            <h1 className="mt-4 text-3xl text-navy sm:text-4xl">Booking confirmed!</h1>
            <p className="mt-2 text-grey-500">A confirmation has been sent to {booking.guestEmail}.</p>
          </>
        )}
        <p className="mt-4 inline-block rounded-full bg-grey-100 px-4 py-1.5 text-sm text-navy">
          Reference <strong className="tracking-wider">{ref}</strong>
        </p>
      </header>

      <article className="mt-10 overflow-hidden rounded-xl border border-grey-100 bg-white shadow-sm">
        <div className="relative h-44 w-full">
          <PropertyImage src={booking.property.coverImage} alt="" sizes="(min-width: 768px) 720px, 100vw" priority />
        </div>
        <div className="space-y-6 p-6">
          <div>
            <Link href={`/property/${booking.property.id}`} className="font-playfair text-2xl text-navy hover:underline">
              {booking.property.name}
            </Link>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-grey-500">
              <MapPin className="h-4 w-4" /> {location}
            </p>
          </div>

          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <Detail label="Date" value={format(parseISO(date), 'EEEE d MMMM yyyy')} />
            <Detail label="Hours" value={window ? `${window.startTime}–${window.endTime}` : '—'} />
            <Detail label="Package" value={booking.package.name} />
            <Detail label="Guests" value={guestSummary(booking)} />
            {addOns.length > 0 && <Detail label="Extras" value={addOns.map((a) => (a.qty > 1 ? `${a.name} × ${a.qty}` : a.name)).join(', ')} />}
            <Detail label="Lead guest" value={booking.guestName} />
          </dl>

          <div className="space-y-2 border-t border-grey-100 pt-5 text-sm">
            {booking.discountAmount > 0 && (
              <div className="flex justify-between text-grey-700">
                <span>Discount{booking.couponCode ? ` (${booking.couponCode})` : ''}</span>
                <span>−{formatEGP(booking.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base">
              <strong className="text-navy">Total</strong>
              <strong className="text-navy">{formatEGP(booking.totalPrice)}</strong>
            </div>
            <div className="flex justify-between text-grey-700">
              <span>Paid online (booking fee)</span>
              <span>{booking.status === 'pending' ? 'Processing' : formatEGP(booking.platformFee)}</span>
            </div>
          </div>

          {confirmed && (
            <div className="flex items-start gap-3 rounded-xl border-2 border-teal bg-teal/10 p-5">
              <Hotel className="mt-0.5 h-6 w-6 shrink-0 text-teal" />
              <div>
                <p className="font-semibold text-navy">Pay {formatEGP(booking.hotelAmount)} on arrival</p>
                <p className="mt-1 text-sm text-grey-700">
                  Show reference <strong>{ref}</strong> at reception and pay the balance directly to {booking.property.name}.
                </p>
              </div>
            </div>
          )}

          {confirmed && window && (
            <AddToCalendar
              uid={booking.id}
              event={{ title: `Day pass — ${booking.property.name}`, date, start: window.startTime, end: window.endTime, location, details: `Reference ${ref}. Pay ${formatEGP(booking.hotelAmount)} on arrival.` }}
            />
          )}
        </div>
      </article>

      {booking.status === 'confirmed' && (
        <section className="mt-8 rounded-xl border border-grey-100 bg-white p-6">
          <h2 className="flex items-center gap-2 text-xl text-navy">
            <Clock className="h-5 w-5 text-coral" /> Plans changed?
          </h2>
          <p className="mb-4 mt-1 text-sm text-grey-500">Changes are free. If you cancel before your visit, your online booking fee is refunded.</p>
          <ManageBooking bookingId={booking.id} token={token} canChange={date > today} canCancel={date >= today} />
        </section>
      )}

      <div className="mt-10 text-center">
        <Link href="/" className={buttonClasses('ghost')}>
          Back to home
        </Link>
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-grey-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-navy">{value}</dd>
    </div>
  )
}
