import { format } from 'date-fns'
import { PropertyFilters } from '@/components/property/PropertyFilters'
import { SearchResults } from '@/components/property/SearchResults'
import { SortSelect } from '@/components/property/SortSelect'
import { searchProperties } from '@/lib/queries/properties'
import { DEFAULT_LIMIT, parseSearchParams } from '@/lib/search'
import { fromDateString } from '@/lib/utils'
import { cityFromSlug, PROPERTY_TYPE_LABELS } from '@/lib/validations/property'

type SearchPageProps = { searchParams: Record<string, string | string[] | undefined> }

export function generateMetadata({ searchParams }: SearchPageProps) {
  const search = parseSearchParams(searchParams)
  const city = cityFromSlug(search.city)
  const kind = search.type ? `${PROPERTY_TYPE_LABELS[search.type].toLowerCase()} day passes` : 'Day passes'
  const where = city ? `in ${city}` : 'in Egypt'
  return {
    title: `${kind[0].toUpperCase()}${kind.slice(1)} ${where} — DayUse Egypt`,
    description: `Compare ${kind.toLowerCase()} ${where}: pools, private beaches and spas by the day. See prices up front and pay most of it on arrival.`,
    // Filtered variants all point search engines at the city page.
    alternates: { canonical: city ? `/search?city=${search.city}` : '/search' },
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  // Always render page 1 on the server; further pages load client-side.
  const search = { ...parseSearchParams(searchParams), page: 1 }
  const result = await searchProperties(search)
  const city = cityFromSlug(search.city)

  // Canonical query (without page) used by "Load more" and to reset results when filters change.
  const query = new URLSearchParams()
  if (search.city) query.set('city', search.city)
  if (search.date) query.set('date', search.date)
  if (search.type) query.set('type', search.type)
  for (const key of ['amenities', 'stars'] as const) {
    const raw = searchParams[key]
    if (typeof raw === 'string' && raw) query.set(key, raw)
  }
  if (search.sort !== 'recommended') query.set('sort', search.sort)
  if (search.limit !== DEFAULT_LIMIT) query.set('limit', String(search.limit))
  const queryString = query.toString()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <h1 className="text-4xl text-navy">Day passes {city ? `in ${city}` : 'across Egypt'}</h1>
        {search.date && <p className="mt-2 text-grey-500">Open on {format(fromDateString(search.date), 'EEEE d MMMM yyyy')}</p>}
      </header>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <PropertyFilters />
        <section aria-label="Results">
          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="text-sm text-grey-500" aria-live="polite">
              <span className="font-semibold text-navy">{result.total}</span> {result.total === 1 ? 'property' : 'properties'} found
            </p>
            <SortSelect value={search.sort} />
          </div>
          <SearchResults key={queryString} initial={result} query={queryString} />
        </section>
      </div>
    </div>
  )
}
