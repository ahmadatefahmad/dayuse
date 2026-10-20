import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import prisma from '@/lib/prisma'
import { cn, toCairoDateString } from '@/lib/utils'
import { PageHeader } from '@/components/admin/PageHeader'
import { ReviewModeration } from '@/components/admin/ReviewModeration'
import { Stars } from '@/components/property/Stars'
import { Badge, type BadgeTone } from '@/components/ui/Badge'

const STATUS: Record<string, [BadgeTone, string]> = { pending: ['coral', 'Pending'], approved: ['teal', 'Approved'], rejected: ['grey', 'Rejected'] }

export default async function AdminReviewsPage({ searchParams }: { searchParams: { tab?: string } }) {
  const tab = searchParams.tab === 'all' ? 'all' : 'pending'
  const [reviews, pendingCount] = await Promise.all([
    prisma.review.findMany({
      where: tab === 'pending' ? { status: 'pending' } : {},
      // Oldest first in the queue (fair order); newest first when browsing everything.
      orderBy: { createdAt: tab === 'pending' ? 'asc' : 'desc' },
      take: 200,
      include: { property: { select: { id: true, name: true } }, booking: { select: { id: true, guestName: true } } },
    }),
    prisma.review.count({ where: { status: 'pending' } }),
  ])

  return (
    <>
      <PageHeader title="Reviews" description="Guests only see approved reviews. Check for personal details, offensive content and off-topic posts." />
      <div className="mb-6 inline-flex rounded-lg bg-grey-100 p-1">
        {[
          ['pending', `Pending (${pendingCount})`],
          ['all', 'All'],
        ].map(([key, label]) => (
          <Link
            key={key}
            href={key === 'pending' ? '/admin/reviews' : '/admin/reviews?tab=all'}
            className={cn('rounded-md px-4 py-1.5 text-sm font-medium', tab === key ? 'bg-white text-navy shadow-sm' : 'text-grey-500 hover:text-navy')}
          >
            {label}
          </Link>
        ))}
      </div>

      {reviews.length === 0 ? (
        <p className="rounded-xl border border-dashed border-grey-300 bg-white p-12 text-center text-sm text-grey-500">{tab === 'pending' ? 'All caught up — no reviews waiting.' : 'No reviews yet.'}</p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => {
            const [tone, label] = STATUS[r.status] ?? ['grey', r.status]
            return (
              <li key={r.id} className="rounded-xl border border-grey-100 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="text-sm">
                    <Link href={`/admin/properties/${r.property.id}`} className="font-semibold text-navy hover:underline">
                      {r.property.name}
                    </Link>
                    <span className="text-grey-500">
                      {' '}
                      · {r.booking.guestName} · submitted {format(parseISO(toCairoDateString(r.createdAt)), 'd MMM yyyy')} ·{' '}
                      <Link href={`/admin/bookings/${r.booking.id}`} className="text-coral hover:underline">
                        booking
                      </Link>
                    </span>
                  </div>
                  <Badge tone={tone}>{label}</Badge>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Stars rating={r.rating} />
                  <span className="text-sm text-grey-500">{r.rating}/5</span>
                </div>
                {r.title && <h3 className="mt-2 font-semibold text-navy">{r.title}</h3>}
                <p className="mt-1 whitespace-pre-line text-sm text-grey-700">{r.body}</p>
                {r.status === 'rejected' && r.adminNote && <p className="mt-2 text-xs text-grey-500">Note to guest: {r.adminNote}</p>}
                <div className="mt-4 border-t border-grey-100 pt-4">
                  <ReviewModeration reviewId={r.id} status={r.status} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
