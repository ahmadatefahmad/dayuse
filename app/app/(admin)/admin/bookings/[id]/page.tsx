import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import prisma from '@/lib/prisma'
import { bookingReference, formatLocation, guestSummary } from '@/lib/booking-format'
import type { AddOnLine } from '@/lib/booking-quote'
import { formatCairoDateTime, formatEGP, toDateString, todayInEgypt } from '@/lib/utils'
import { BookingAdminActions } from '@/components/admin/BookingAdminActions'
import { BookingStatusPill } from '@/components/admin/BookingStatusPill'
import { buttonClasses } from '@/components/ui/Button'

// Test-mode keys get test-mode dashboard links.
const stripeUrl = (kind: 'payments' | 'refunds', id: string) =>
  `https://dashboard.stripe.com/${process.env.STRIPE_SECRET_KEY?.startsWith('sk_live') ? '' : 'test/'}${kind}/${id}`

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-grey-100 bg-white p-5">
      <h2 className="mb-4 text-lg text-navy">{title}</h2>
      {children}
    </section>
  )
}

function Rows({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="space-y-2 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4">
          <dt className="shrink-0 text-grey-500">{k}</dt>
          <dd className="min-w-0 break-words text-right text-navy">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

export default async function AdminBookingDetailPage({ params }: { params: { id: string } }) {
  const b = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      property: { select: { id: true, name: true, address: true, area: true, city: true } },
      package: { select: { name: true } },
      user: { select: { email: true } },
      changeHistory: { orderBy: { changedAt: 'desc' } },
      reviews: { select: { id: true, rating: true, status: true } },
    },
  })
  if (!b) notFound()

  const notifications = await prisma.notificationLog.findMany({ where: { bookingId: b.id }, orderBy: { sentAt: 'desc' }, take: 20 })
  const date = toDateString(b.bookingDate)
  const addOns = (b.addOns as AddOnLine[] | null) ?? []

  return (
    <div className="space-y-6">
      <Link href="/admin/bookings" className="inline-flex items-center gap-1 text-sm text-grey-500 hover:text-navy">
        <ArrowLeft className="h-4 w-4" /> All bookings
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl text-navy">{bookingReference(b.id)}</h1>
          <BookingStatusPill status={b.status} />
        </div>
        <Link href={`/booking/${b.id}`} target="_blank" className={buttonClasses('ghost', 'sm')}>
          Guest view <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Section title="Visit">
            <Rows
              rows={[
                ['Property', <Link key="p" href={`/admin/properties/${b.property.id}`} className="text-coral hover:underline">{b.property.name}</Link>],
                ['Location', formatLocation(b.property.address, b.property.area, b.property.city)],
                ['Date', format(parseISO(date), 'EEEE d MMMM yyyy')],
                ['Package', b.package.name],
                ['Guests', guestSummary(b)],
                ['Extras', addOns.length ? addOns.map((a) => `${a.name} × ${a.qty} (${formatEGP(a.total)})`).join(', ') : 'None'],
                ['Special requests', b.specialRequests || '—'],
              ]}
            />
          </Section>

          <Section title="Guest">
            <Rows
              rows={[
                ['Name', b.guestName],
                ['Email', <a key="e" href={`mailto:${b.guestEmail}`} className="text-coral hover:underline">{b.guestEmail}</a>],
                ['Phone', <a key="t" href={`tel:${b.guestPhone}`} className="text-coral hover:underline">{b.guestPhone}</a>],
                ['Account', b.user ? b.user.email : 'Booked as guest'],
                ['Review', b.reviews[0] ? `${b.reviews[0].rating}★ (${b.reviews[0].status})` : '—'],
              ]}
            />
          </Section>

          <Section title="Payment">
            <Rows
              rows={[
                ['Total', <strong key="t">{formatEGP(b.totalPrice)}</strong>],
                ...(b.discountAmount > 0 ? ([['Discount', `−${formatEGP(b.discountAmount)}${b.couponCode ? ` (${b.couponCode})` : ''}`]] as [string, string][]) : []),
                ['Platform fee (online)', formatEGP(b.platformFee)],
                ['Hotel amount (on arrival)', formatEGP(b.hotelAmount)],
                [
                  'Stripe payment',
                  b.stripePaymentId ? (
                    <a key="s" href={stripeUrl('payments', b.stripePaymentId)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-coral hover:underline">
                      {b.stripePaymentId} <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    'None (free booking)'
                  ),
                ],
                ['Refund', b.stripeRefundId ? <a key="r" href={stripeUrl('refunds', b.stripeRefundId)} target="_blank" rel="noopener noreferrer" className="text-coral hover:underline">{b.stripeRefundId}</a> : '—'],
              ]}
            />
          </Section>

          {b.changeHistory.length > 0 && (
            <Section title="Changes">
              <ul className="space-y-2 text-sm">
                {b.changeHistory.map((c) => (
                  <li key={c.id} className="flex justify-between gap-4">
                    <span className="text-navy">
                      {c.oldDate && format(parseISO(toDateString(c.oldDate)), 'd MMM')} → {c.newDate && format(parseISO(toDateString(c.newDate)), 'd MMM yyyy')}
                      {c.oldPackageId !== c.newPackageId && ' (package changed)'}
                    </span>
                    <span className="text-grey-500">
                      {c.priceDiff > 0 ? `+${formatEGP(c.priceDiff)} charged` : c.priceDiff < 0 ? `${formatEGP(-c.priceDiff)} refunded` : 'no fee change'} · {formatCairoDateTime(c.changedAt, false)}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Notifications">
            {notifications.length === 0 ? (
              <p className="text-sm text-grey-500">None sent yet.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {notifications.map((n) => (
                  <li key={n.id} className="flex justify-between gap-4">
                    <span className="text-navy">
                      {n.type.replace(/_/g, ' ')} · {n.channel}
                    </span>
                    <span className={n.status === 'sent' ? 'text-teal' : 'text-red-600'} title={n.error ?? undefined}>
                      {n.status} · {formatCairoDateTime(n.sentAt, false)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Section title="Actions">
            <BookingAdminActions bookingId={b.id} status={b.status} canComplete={b.status === 'confirmed' && date <= todayInEgypt()} note={b.internalNotes} platformFee={b.platformFee} />
          </Section>
          <Section title="Record">
            <Rows
              rows={[
                ['Booking ID', <code key="i" className="text-xs">{b.id}</code>],
                ['Created', formatCairoDateTime(b.createdAt)],
                ['Last updated', formatCairoDateTime(b.updatedAt)],
              ]}
            />
          </Section>
        </aside>
      </div>
    </div>
  )
}
