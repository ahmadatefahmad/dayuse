import type { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import type { PropertyCardData, PropertySearch, SearchResult, SortKey } from '@/lib/search'
import { fromDateString } from '@/lib/utils'
import { cityFromSlug } from '@/lib/validations/property'

// Bookable properties matching the search. Price and rating sorts need aggregates
// Prisma can't order by, so matches are sorted in memory — fine at marketplace MVP scale.
export async function searchProperties(search: PropertySearch): Promise<SearchResult> {
  const where: Prisma.PropertyWhereInput = {
    active: true,
    packages: { some: { active: true } }, // nothing to book without an active package
  }
  const city = cityFromSlug(search.city)
  if (city) where.city = city
  if (search.type) where.type = search.type
  if (search.amenities.length) where.amenities = { hasEvery: search.amenities }
  if (search.stars.length) where.stars = { in: search.stars }
  // Blackout dates are hard blocks. Capacity is checked at booking time, not here.
  if (search.date) where.blackoutDates = { none: { date: fromDateString(search.date) } }

  const rows = await prisma.property.findMany({
    where,
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      area: true,
      type: true,
      stars: true,
      coverImage: true,
      amenities: true,
      createdAt: true,
      packages: { where: { active: true }, select: { adultPrice: true } },
    },
  })

  const ratings = rows.length
    ? await prisma.review.groupBy({
        by: ['propertyId'],
        where: { status: 'approved', propertyId: { in: rows.map((r) => r.id) } },
        _avg: { rating: true },
        _count: { _all: true },
      })
    : []
  const ratingById = new Map(ratings.map((r) => [r.propertyId, r]))

  type Entry = { card: PropertyCardData; createdAt: Date }
  const entries: Entry[] = rows.map(({ packages, createdAt, ...p }) => {
    const r = ratingById.get(p.id)
    return {
      card: {
        ...p,
        minPrice: Math.min(...packages.map((pkg) => pkg.adultPrice)),
        rating: r?._avg.rating ?? null,
        reviewCount: r?._count._all ?? 0,
      },
      createdAt,
    }
  })

  const byNewest = (a: Entry, b: Entry) => b.createdAt.getTime() - a.createdAt.getTime()
  const byRating = (a: Entry, b: Entry) => (b.card.rating ?? -1) - (a.card.rating ?? -1) || b.card.reviewCount - a.card.reviewCount
  const comparators: Record<SortKey, (a: Entry, b: Entry) => number> = {
    recommended: (a, b) => byRating(a, b) || (b.card.stars ?? 0) - (a.card.stars ?? 0) || byNewest(a, b),
    price_asc: (a, b) => a.card.minPrice - b.card.minPrice || byNewest(a, b),
    price_desc: (a, b) => b.card.minPrice - a.card.minPrice || byNewest(a, b),
    rating: (a, b) => byRating(a, b) || byNewest(a, b),
  }
  entries.sort(comparators[search.sort])

  const start = (search.page - 1) * search.limit
  return {
    properties: entries.slice(start, start + search.limit).map((e) => e.card),
    total: entries.length,
    page: search.page,
    limit: search.limit,
  }
}
