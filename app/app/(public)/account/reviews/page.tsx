import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { CheckCircle2 } from 'lucide-react'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { toDateString } from '@/lib/utils'
import { Stars } from '@/components/property/Stars'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { buttonClasses } from '@/components/ui/Button'

const STATUS: Record<string, [BadgeTone, string]> = { pending: ['coral', 'Pending'], approved: ['teal', 'Published'], rejected: ['grey', 'Rejected'] }

export default async function AccountReviewsPage({ searchParams }: { searchParams: { submitted?: string } }) {
  const user = await requireAuth('/account/reviews')
  const reviews = await prisma.review.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { property: { select: { id: true, name: true } }, booking: { select: { bookingDate: true } } },
  })

  return (
    <div className="space-y-4">
      {searchParams.submitted && (
        <p className="flex items-center gap-2 rounded-lg bg-teal/10 p-4 text-sm text-teal">
          <CheckCircle2 className="h-5 w-5" /> Thanks! Your review was submitted and will appear once our team has checked it.
        </p>
      )}
      {reviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-grey-300 bg-white p-12 text-center">
          <p className="text-grey-500">You haven&apos;t written any reviews yet. After a visit, you can review it from your past bookings.</p>
          <Link href="/account/bookings?tab=past" className={buttonClasses('secondary', 'md', 'mt-6')}>
            Past bookings
          </Link>
        </div>
      ) : (
        reviews.map((r) => {
          const [tone, label] = STATUS[r.status] ?? ['grey', r.status]
          return (
            <article key={r.id} className="rounded-xl border border-grey-100 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/property/${r.property.id}`} className="font-playfair text-xl text-navy hover:underline">
                    {r.property.name}
                  </Link>
                  <p className="text-xs text-grey-500">
                    Visited {format(parseISO(toDateString(r.booking.bookingDate)), 'd MMM yyyy')} · written {format(r.createdAt, 'd MMM yyyy')}
                  </p>
                </div>
                <Badge tone={tone}>{label}</Badge>
              </div>
              <Stars rating={r.rating} className="mt-3" />
              {r.title && <h3 className="mt-2 font-semibold text-navy">{r.title}</h3>}
              <p className="mt-1 whitespace-pre-line text-sm text-grey-700">{r.body}</p>
              {r.status === 'rejected' && r.adminNote && (
                <p className="mt-3 rounded-lg bg-grey-50 p-3 text-sm text-grey-700">
                  <strong className="text-navy">Note from our team:</strong> {r.adminNote}
                </p>
              )}
            </article>
          )
        })
      )}
    </div>
  )
}
