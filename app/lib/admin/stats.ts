import { addDays, format, parseISO } from 'date-fns'
import prisma from '@/lib/prisma'
import { cairoStartOfDay, toCairoDateString, todayInEgypt } from '@/lib/utils'

// Unpaid checkouts aren't bookings yet, so every KPI ignores `pending`.
const REAL = { status: { not: 'pending' } }
const EARNING = ['confirmed', 'completed']
export const CHART_DAYS = 30

// All periods are Cairo calendar days/months, based on when the booking was made (createdAt).
export async function getDashboardStats() {
  const today = todayInEgypt()
  const dayStart = cairoStartOfDay(today)
  const monthStart = cairoStartOfDay(`${today.slice(0, 8)}01`)
  const firstChartDay = format(addDays(parseISO(today), -(CHART_DAYS - 1)), 'yyyy-MM-dd')
  const chartStart = cairoStartOfDay(firstChartDay)

  const [todayBookings, monthBookings, monthCancelled, revenue, activeProperties, pendingReviews, recent, chartRows] = await Promise.all([
    prisma.booking.count({ where: { ...REAL, createdAt: { gte: dayStart } } }),
    prisma.booking.count({ where: { ...REAL, createdAt: { gte: monthStart } } }),
    prisma.booking.count({ where: { status: 'cancelled', createdAt: { gte: monthStart } } }),
    // Platform fees we keep: confirmed/completed only (cancelled ones were refunded).
    prisma.booking.aggregate({ where: { status: { in: EARNING }, createdAt: { gte: monthStart } }, _sum: { platformFee: true } }),
    prisma.property.count({ where: { active: true } }),
    prisma.review.count({ where: { status: 'pending' } }),
    prisma.booking.findMany({
      where: REAL,
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { property: { select: { name: true } } },
    }),
    prisma.booking.findMany({ where: { ...REAL, createdAt: { gte: chartStart } }, select: { createdAt: true } }),
  ])

  const perDay = new Map<string, number>()
  for (let i = 0; i < CHART_DAYS; i++) perDay.set(format(addDays(parseISO(firstChartDay), i), 'yyyy-MM-dd'), 0)
  for (const { createdAt } of chartRows) {
    const day = toCairoDateString(createdAt)
    if (perDay.has(day)) perDay.set(day, perDay.get(day)! + 1)
  }

  return {
    todayBookings,
    monthBookings,
    monthRevenue: revenue._sum.platformFee ?? 0,
    activeProperties,
    pendingReviews,
    cancellationRate: monthBookings ? monthCancelled / monthBookings : null,
    recent,
    bookingsPerDay: Array.from(perDay, ([date, count]) => ({ date, count })),
  }
}
