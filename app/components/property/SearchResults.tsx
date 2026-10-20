'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PropertyCard, PropertyCardSkeleton } from '@/components/property/PropertyCard'
import { Button, buttonClasses } from '@/components/ui/Button'
import type { SearchResult } from '@/lib/search'

type Props = { initial: SearchResult; query: string }

// First page is server-rendered; "Load more" appends further pages from /api/properties.
// The parent keys this component by `query`, so changing filters starts fresh.
export function SearchResults({ initial, query }: Props) {
  const [items, setItems] = useState(initial.properties)
  const [page, setPage] = useState(initial.page)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasMore = items.length < initial.total

  async function loadMore() {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams(query)
      params.set('page', String(page + 1))
      const res = await fetch(`/api/properties?${params}`)
      if (!res.ok) throw new Error()
      const next: SearchResult = await res.json()
      setItems((current) => [...current, ...next.properties.filter((p) => !current.some((c) => c.id === p.id))])
      setPage(next.page)
    } catch {
      setError('Couldn’t load more properties. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) return <EmptyState />

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((p, i) => (
          <PropertyCard key={p.id} property={p} priority={i < 3} />
        ))}
        {loading && Array.from({ length: 3 }, (_, i) => <PropertyCardSkeleton key={`s${i}`} />)}
      </div>
      {error && <p className="mt-6 text-center text-sm text-red-600">{error}</p>}
      {hasMore && (
        <div className="mt-10 flex flex-col items-center gap-2">
          <Button variant="secondary" size="lg" onClick={loadMore} loading={loading}>
            Load more
          </Button>
          <p className="text-xs text-grey-500">
            Showing {items.length} of {initial.total}
          </p>
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-grey-300 bg-white px-6 py-16 text-center">
      <svg viewBox="0 0 200 120" className="h-28 w-48" aria-hidden>
        <circle cx="140" cy="38" r="20" className="fill-sand" />
        <path d="M0 80 Q25 68 50 80 T100 80 T150 80 T200 80 V120 H0Z" className="fill-teal/30" />
        <path d="M0 92 Q25 80 50 92 T100 92 T150 92 T200 92 V120 H0Z" className="fill-teal/60" />
        <path d="M60 80 L60 40 M60 40 Q45 38 38 50 M60 40 Q75 38 82 50 M60 40 Q50 30 40 34 M60 40 Q70 30 80 34" className="fill-none stroke-navy" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <h2 className="mt-6 text-2xl text-navy">No escapes match those filters</h2>
      <p className="mt-2 max-w-sm text-sm text-grey-500">Try another date, remove an amenity, or widen your search to all cities.</p>
      <Link href="/search" className={buttonClasses('primary', 'md', 'mt-6')}>
        Clear filters
      </Link>
    </div>
  )
}
