'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { PenLine } from 'lucide-react'
import { Stars } from '@/components/property/Stars'
import { Button, buttonClasses } from '@/components/ui/Button'
import type { PublicReview } from '@/lib/queries/reviews'

type Props = { propertyId: string; initial: PublicReview[]; total: number }

export function ReviewList({ propertyId, initial, total }: Props) {
  const [reviews, setReviews] = useState(initial)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  async function loadMore() {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/properties/${propertyId}/reviews?page=${page + 1}`)
      if (!res.ok) throw new Error()
      const data: { reviews: PublicReview[] } = await res.json()
      setReviews((r) => [...r, ...data.reviews.filter((n) => !r.some((o) => o.id === n.id))])
      setPage((p) => p + 1)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <article key={r.id} className="rounded-xl border border-grey-100 bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sand font-semibold text-navy">
              {r.authorName
                .split(' ')
                .map((w) => w[0])
                .join('')
                .slice(0, 2)}
            </span>
            <div className="min-w-0">
              <p className="font-medium text-navy">{r.authorName}</p>
              <p className="text-xs text-grey-500">{format(new Date(r.createdAt), 'MMMM yyyy')}</p>
            </div>
            <Stars rating={r.rating} className="ml-auto" />
          </div>
          {r.title && <h4 className="mt-3 font-semibold text-navy">{r.title}</h4>}
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-grey-700">{r.body}</p>
        </article>
      ))}
      {error && <p className="text-sm text-red-600">Couldn&apos;t load more reviews. Please try again.</p>}
      {reviews.length < total && (
        <Button variant="secondary" onClick={loadMore} loading={loading}>
          Load more reviews
        </Button>
      )}
    </div>
  )
}

// Shown only to signed-in guests with a past confirmed, not-yet-reviewed booking here.
export function ReviewCta({ propertyId }: { propertyId: string }) {
  const [bookingId, setBookingId] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/properties/${propertyId}/review-eligibility`)
      .then((res) => (res.ok ? res.json() : { bookingId: null }))
      .then((data) => setBookingId(data.bookingId))
      .catch(() => setBookingId(null))
  }, [propertyId])

  if (!bookingId) return null
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl bg-sand/30 p-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-navy">How was your day here? Your review helps other guests choose.</p>
      <Link href={`/account/reviews/new?bookingId=${bookingId}`} className={buttonClasses('primary', 'sm')}>
        <PenLine className="h-4 w-4" /> Write a review
      </Link>
    </div>
  )
}
