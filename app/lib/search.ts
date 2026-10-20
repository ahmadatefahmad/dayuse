// Search types and URL parsing shared by server and client code. Keep this file free of
// server-only imports (Prisma etc.) — client components import it.
import { todayInEgypt } from '@/lib/utils'
import { amenityFromSlug, cityFromSlug, PROPERTY_TYPES, type PropertyInput } from '@/lib/validations/property'

export const SORTS = {
  recommended: 'Recommended',
  price_asc: 'Price: low to high',
  price_desc: 'Price: high to low',
  rating: 'Top rated',
} as const
export type SortKey = keyof typeof SORTS

export type PropertySearch = {
  city?: string // slug, e.g. "hurghada"
  date?: string // YYYY-MM-DD
  type?: PropertyInput['type']
  amenities: string[] // amenity display names
  stars: number[]
  sort: SortKey
  page: number
  limit: number
}

export type PropertyCardData = {
  id: string
  name: string
  slug: string
  city: string
  area: string | null
  type: string
  stars: number | null
  coverImage: string
  amenities: string[]
  minPrice: number
  rating: number | null
  reviewCount: number
}

export type SearchResult = { properties: PropertyCardData[]; total: number; page: number; limit: number }

export const DEFAULT_LIMIT = 12
const MAX_LIMIT = 48

type RawParams = Record<string, string | string[] | undefined> | URLSearchParams

// Turns ?city=&date=&type=&amenities=&stars=&sort=&page=&limit= into a validated search.
// Unknown or malformed values are dropped rather than erroring, since they come from URLs.
export function parseSearchParams(raw: RawParams): PropertySearch {
  const get = (key: string) => {
    const v = raw instanceof URLSearchParams ? raw.get(key) : raw[key]
    return (Array.isArray(v) ? v[0] : v) ?? undefined
  }
  const list = (key: string) => (get(key) ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  const int = (key: string, fallback: number, min: number, max: number) => {
    const n = Number.parseInt(get(key) ?? '', 10)
    return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : fallback
  }

  const city = get('city')
  const date = get('date')
  const type = get('type')
  const sort = get('sort')

  return {
    city: cityFromSlug(city) ? city : undefined,
    date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= todayInEgypt() ? date : undefined,
    type: PROPERTY_TYPES.find((t) => t === type),
    amenities: list('amenities').flatMap((s) => amenityFromSlug(s) ?? []),
    stars: list('stars').map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= 5),
    sort: sort && sort in SORTS ? (sort as SortKey) : 'recommended',
    page: int('page', 1, 1, 1000),
    limit: int('limit', DEFAULT_LIMIT, 1, MAX_LIMIT),
  }
}
