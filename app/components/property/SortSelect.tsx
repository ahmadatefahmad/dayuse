'use client'

import { useSearchUpdate } from '@/components/property/useSearchUpdate'
import { cn } from '@/lib/utils'
import { SORTS, type SortKey } from '@/lib/search'

const SHORT: Record<SortKey, string> = {
  recommended: 'Best',
  price_asc:   '↑ Price',
  price_desc:  '↓ Price',
  rating:      '★ Top',
}

const FULL: Record<SortKey, string> = {
  recommended: 'Recommended',
  price_asc:   'Price: low',
  price_desc:  'Price: high',
  rating:      'Top rated',
}

export function SortSelect({ value }: { value: SortKey }) {
  const { update } = useSearchUpdate()
  return (
    <div
      className="flex items-center gap-0.5 rounded-xl border border-grey-200 bg-grey-50 p-1"
      role="group"
      aria-label="Sort by"
    >
      {(Object.keys(SORTS) as SortKey[]).map((key) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => update({ sort: key === 'recommended' ? null : key })}
          className={cn(
            'rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-all',
            value === key
              ? 'bg-white text-navy shadow-sm ring-1 ring-grey-200'
              : 'text-grey-500 hover:text-navy',
          )}
        >
          <span className="sm:hidden">{SHORT[key]}</span>
          <span className="hidden sm:inline">{FULL[key]}</span>
        </button>
      ))}
    </div>
  )
}
