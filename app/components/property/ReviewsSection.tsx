import { ReviewCta, ReviewList } from '@/components/property/ReviewList'
import { Stars } from '@/components/property/Stars'
import type { getReviewSummary, PublicReview } from '@/lib/queries/reviews'

type Props = {
  propertyId: string
  summary: Awaited<ReturnType<typeof getReviewSummary>>
  reviews: PublicReview[]
}

export function ReviewsSection({ propertyId, summary, reviews }: Props) {
  return (
    <section id="reviews" className="scroll-mt-24 space-y-6">
      <h2 className="text-2xl text-navy">Guest reviews</h2>

      {summary.average === null ? (
        <p className="rounded-xl border border-dashed border-grey-300 p-6 text-sm text-grey-500">No reviews yet. Guests who visit can review their day here.</p>
      ) : (
        <>
          <div className="grid gap-6 rounded-xl bg-grey-50 p-6 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="text-center sm:pr-6">
              <p className="font-playfair text-5xl text-navy">{summary.average.toFixed(1)}</p>
              <Stars rating={summary.average} className="mt-2" />
              <p className="mt-1 text-sm text-grey-500">
                {summary.total} review{summary.total === 1 ? '' : 's'}
              </p>
            </div>
            <ul className="space-y-1.5">
              {summary.counts.map(({ stars, count }) => {
                const pct = Math.round((count / summary.total) * 100)
                return (
                  <li key={stars} className="flex items-center gap-3 text-sm">
                    <span className="w-6 text-grey-700">{stars}★</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-grey-100">
                      <span className="block h-full rounded-full bg-coral" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="w-10 text-right text-grey-500">{pct}%</span>
                  </li>
                )
              })}
            </ul>
          </div>
          <ReviewList propertyId={propertyId} initial={reviews} total={summary.total} />
        </>
      )}

      <ReviewCta propertyId={propertyId} />
    </section>
  )
}
