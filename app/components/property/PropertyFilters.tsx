'use client'

import { useEffect, useState } from 'react'
import { Building2, LayoutGrid, SlidersHorizontal, Umbrella, Waves, X } from 'lucide-react'
import { useSearchUpdate } from '@/components/property/useSearchUpdate'
import { AMENITY_ICONS } from '@/components/property/amenities'
import { Button } from '@/components/ui/Button'
import { CalendarPopover } from '@/components/ui/CalendarPopover'
import { Spinner } from '@/components/ui/Spinner'
import { cn, todayInEgypt } from '@/lib/utils'
import {
  AMENITIES,
  amenitySlug,
  CITIES,
  citySlug,
  PROPERTY_TYPE_LABELS,
  PROPERTY_TYPES,
} from '@/lib/validations/property'

const FILTER_KEYS = ['city', 'date', 'type', 'amenities', 'stars']

const TYPE_ICONS = {
  hotel: Building2,
  beach_club: Umbrella,
  resort: Waves,
} as const

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b border-grey-100 pb-5">
      <legend className="mb-3 text-xs font-semibold uppercase tracking-widest text-grey-500">{title}</legend>
      {children}
    </fieldset>
  )
}

function FilterFields() {
  const { searchParams, update } = useSearchUpdate()
  const list = (key: string) =>
    (searchParams.get(key) ?? '').split(',').filter(Boolean)
  const toggleInList = (key: string, value: string) => {
    const current = list(key)
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    update({ [key]: next.join(',') || null })
  }
  const type = searchParams.get('type') ?? ''
  const amenities = list('amenities')
  const stars = list('stars')
  const city = searchParams.get('city') ?? ''
  const date = searchParams.get('date') ?? ''

  return (
    <div className="space-y-5">
      {/* City */}
      <FilterGroup title="City">
        <div className="flex flex-wrap gap-2">
          {(['', ...CITIES] as const).map((c) => {
            const slug = c ? citySlug(c) : ''
            const active = city === slug
            return (
              <button
                key={c || 'any'}
                type="button"
                onClick={() => update({ city: slug || null })}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                  active
                    ? 'border-coral bg-coral text-white shadow-sm'
                    : 'border-grey-200 text-grey-700 hover:border-navy/40 hover:bg-grey-50',
                )}
              >
                {c || 'Any city'}
              </button>
            )
          })}
        </div>
      </FilterGroup>

      {/* Date */}
      <FilterGroup title="Date">
        <CalendarPopover
          value={date}
          min={todayInEgypt()}
          onChange={(d) => update({ date: d })}
        />
        <p className="mt-2 text-xs text-grey-500">Hides places closed on that day.</p>
      </FilterGroup>

      {/* Type */}
      <FilterGroup title="Type">
        <div className="grid grid-cols-4 gap-2">
          {([null, ...PROPERTY_TYPES] as const).map((t) => {
            const active = type === (t ?? '')
            const Icon = t ? TYPE_ICONS[t] : LayoutGrid
            const label = t ? PROPERTY_TYPE_LABELS[t] : 'All'
            return (
              <button
                key={t ?? 'all'}
                type="button"
                onClick={() => update({ type: t || null })}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-xl border py-3 text-center transition-all',
                  active
                    ? 'border-coral bg-coral/5 text-coral shadow-sm'
                    : 'border-grey-200 text-grey-700 hover:border-navy/30 hover:bg-grey-50',
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-semibold leading-tight">{label}</span>
              </button>
            )
          })}
        </div>
      </FilterGroup>

      {/* Amenities */}
      <FilterGroup title="Amenities">
        <div className="grid grid-cols-2 gap-1.5">
          {AMENITIES.map((a) => {
            const slug = amenitySlug(a)
            const active = amenities.includes(slug)
            const Icon = AMENITY_ICONS[a]
            return (
              <button
                key={a}
                type="button"
                onClick={() => toggleInList('amenities', slug)}
                aria-pressed={active}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-all',
                  active
                    ? 'border-coral bg-coral/5 text-coral shadow-sm'
                    : 'border-grey-200 text-grey-700 hover:border-navy/30 hover:bg-grey-50',
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{a}</span>
              </button>
            )
          })}
        </div>
      </FilterGroup>

      {/* Stars */}
      <FilterGroup title="Stars">
        <div className="flex flex-wrap gap-2">
          {[5, 4, 3, 2, 1].map((n) => {
            const on = stars.includes(String(n))
            return (
              <button
                key={n}
                type="button"
                onClick={() => toggleInList('stars', String(n))}
                aria-pressed={on}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
                  on
                    ? 'border-coral bg-coral text-white shadow-sm'
                    : 'border-grey-200 text-grey-700 hover:border-navy/40',
                )}
              >
                {'★'.repeat(n)}
              </button>
            )
          })}
        </div>
      </FilterGroup>
    </div>
  )
}

export function PropertyFilters() {
  const { searchParams, update, pending } = useSearchUpdate()
  const [open, setOpen] = useState(false)
  const activeCount = FILTER_KEYS.filter((k) => searchParams.get(k)).length
  const clearAll = () =>
    update(Object.fromEntries(FILTER_KEYS.map((k) => [k, null])))

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const header = (
    <div className="mb-5 flex items-center justify-between">
      <h2 className="flex items-center gap-2 font-inter text-base font-semibold text-navy">
        Filters {pending && <Spinner className="h-4 w-4" label="Updating results" />}
      </h2>
      {activeCount > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="text-sm text-coral hover:underline"
        >
          Clear all
        </button>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          {header}
          <FilterFields />
        </div>
      </aside>

      {/* Mobile trigger */}
      <div className="lg:hidden">
        <Button variant="secondary" onClick={() => setOpen(true)}>
          <SlidersHorizontal className="h-4 w-4" />
          Filters{activeCount > 0 && ` (${activeCount})`}
        </Button>
      </div>

      {/* Mobile bottom sheet */}
      {open && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
        >
          <div
            className="absolute inset-0 bg-navy/50"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] animate-sheet-up flex-col rounded-t-2xl bg-white shadow-xl">
            <div
              className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-grey-300"
              aria-hidden
            />
            <div className="flex items-center justify-between px-5 pb-2 pt-3">
              <h2 className="flex items-center gap-2 font-inter text-base font-semibold text-navy">
                Filters{' '}
                {pending && <Spinner className="h-4 w-4" label="Updating results" />}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close filters"
                className="-m-2 p-2"
              >
                <X className="h-5 w-5 text-navy" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-4">
              <FilterFields />
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-grey-100 p-4">
              <Button variant="secondary" onClick={clearAll} disabled={activeCount === 0}>
                Reset
              </Button>
              <Button onClick={() => setOpen(false)}>Apply</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
