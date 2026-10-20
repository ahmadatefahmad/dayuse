import prisma from '@/lib/prisma'

export type PublicReview = {
  id: string
  rating: number
  title: string | null
  body: string
  createdAt: string
  authorName: string
}

export const REVIEWS_PAGE_SIZE = 5

// Only approved reviews are ever shown publicly (README rule 4).
export async function getReviews(propertyId: string, page = 1, limit = REVIEWS_PAGE_SIZE) {
  const where = { propertyId, status: 'approved' }
  const [rows, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: { id: true, rating: true, title: true, body: true, createdAt: true, user: { select: { name: true } }, booking: { select: { guestName: true } } },
    }),
    prisma.review.count({ where }),
  ])
  const reviews: PublicReview[] = rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    createdAt: r.createdAt.toISOString(),
    // Show first name + initial only, e.g. "Mona K."
    authorName: shortName(r.user.name ?? r.booking.guestName),
  }))
  return { reviews, total, page, limit }
}

export async function getReviewSummary(propertyId: string) {
  const groups = await prisma.review.groupBy({
    by: ['rating'],
    where: { propertyId, status: 'approved' },
    _count: { _all: true },
  })
  const counts = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: groups.find((g) => g.rating === stars)?._count._all ?? 0 }))
  const total = counts.reduce((s, c) => s + c.count, 0)
  const average = total ? counts.reduce((s, c) => s + c.stars * c.count, 0) / total : null
  return { average, total, counts }
}

function shortName(name: string) {
  const [first, ...rest] = name.trim().split(/\s+/)
  const last = rest.at(-1)
  return last ? `${first} ${last[0].toUpperCase()}.` : first || 'Guest'
}
