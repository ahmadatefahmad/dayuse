import type { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { bookingReference } from '@/lib/booking-format'
import { fromDateString, isDateString, toDateString } from '@/lib/utils'

export const BOOKING_STATUSES = ['pending', 'confirmed', 'changed', 'completed', 'cancelled'] as const
export const ADMIN_PAGE_SIZE = 25
const SORTS = { date: 'bookingDate', created: 'createdAt', total: 'totalPrice' } as const
export type AdminSort = keyof typeof SORTS

export type AdminBookingFilters = {
  status?: string
  propertyId?: string
  from?: string // booking date range, YYYY-MM-DD
  to?: string
  q?: string // guest name / email / reference
  sort: AdminSort
  dir: 'asc' | 'desc'
  page: number
}

type Raw = Record<string, string | string[] | undefined> | URLSearchParams

export function parseAdminBookingFilters(raw: Raw): AdminBookingFilters {
  const get = (k: string) => {
    const v = raw instanceof URLSearchParams ? raw.get(k) : raw[k]
    return (Array.isArray(v) ? v[0] : v)?.trim() || undefined
  }
  const status = get('status')
  const sort = get('sort')
  return {
    status: BOOKING_STATUSES.find((s) => s === status),
    propertyId: get('property'),
    from: isDateString(get('from')) ? get('from') : undefined,
    to: isDateString(get('to')) ? get('to') : undefined,
    q: get('q')?.slice(0, 100),
    sort: sort && sort in SORTS ? (sort as AdminSort) : 'created',
    dir: get('dir') === 'asc' ? 'asc' : 'desc',
    page: Math.max(Number.parseInt(get('page') ?? '1', 10) || 1, 1),
  }
}

// Turns filters back into a query string (for pagination, sort links and CSV export).
export function filtersToQuery(f: AdminBookingFilters, overrides: Partial<Record<string, string | number | undefined>> = {}) {
  const params = new URLSearchParams()
  const entries: Record<string, string | number | undefined> = {
    status: f.status,
    property: f.propertyId,
    from: f.from,
    to: f.to,
    q: f.q,
    sort: f.sort === 'created' ? undefined : f.sort,
    dir: f.dir === 'desc' ? undefined : f.dir,
    page: f.page > 1 ? f.page : undefined,
    ...overrides,
  }
  for (const [k, v] of Object.entries(entries)) if (v !== undefined && v !== '') params.set(k, String(v))
  return params.toString()
}

function buildWhere(f: AdminBookingFilters): Prisma.BookingWhereInput {
  const where: Prisma.BookingWhereInput = {}
  if (f.status) where.status = f.status
  if (f.propertyId) where.propertyId = f.propertyId
  if (f.from || f.to) where.bookingDate = { ...(f.from ? { gte: fromDateString(f.from) } : {}), ...(f.to ? { lte: fromDateString(f.to) } : {}) }
  if (f.q) {
    // A reference like "DU-4F7A2C9B" matches the end of the booking id.
    const ref = f.q.replace(/^DU-/i, '').toLowerCase()
    where.OR = [
      { guestName: { contains: f.q, mode: 'insensitive' } },
      { guestEmail: { contains: f.q, mode: 'insensitive' } },
      { guestPhone: { contains: f.q.replace(/\s/g, '') } },
      ...(ref.length >= 4 ? [{ id: { endsWith: ref } }] : []),
    ]
  }
  return where
}

export async function listAdminBookings(f: AdminBookingFilters, opts: { all?: boolean } = {}) {
  const where = buildWhere(f)
  const [rows, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: [{ [SORTS[f.sort]]: f.dir }, { createdAt: 'desc' as const }],
      skip: opts.all ? 0 : (f.page - 1) * ADMIN_PAGE_SIZE,
      take: opts.all ? 10_000 : ADMIN_PAGE_SIZE,
      include: { property: { select: { name: true } }, package: { select: { name: true } } },
    }),
    prisma.booking.count({ where }),
  ])
  return { rows, total, pageCount: Math.max(Math.ceil(total / ADMIN_PAGE_SIZE), 1) }
}

type Row = Awaited<ReturnType<typeof listAdminBookings>>['rows'][number]

// Excel-friendly CSV. Cells starting with = + - @ are prefixed so spreadsheets don't run them as formulas.
export function bookingsToCsv(rows: Row[]) {
  const cell = (v: unknown) => {
    let s = v === null || v === undefined ? '' : String(v)
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const header = ['Reference', 'Booking ID', 'Status', 'Visit date', 'Property', 'Package', 'Guest', 'Email', 'Phone', 'Adults', 'Children', 'Infants', 'Total EGP', 'Paid online EGP', 'Due at hotel EGP', 'Discount EGP', 'Coupon', 'Stripe payment', 'Created']
  const lines = rows.map((b) =>
    [
      bookingReference(b.id),
      b.id,
      b.status,
      toDateString(b.bookingDate),
      b.property.name,
      b.package.name,
      b.guestName,
      b.guestEmail,
      b.guestPhone,
      b.adults,
      b.children,
      b.infants,
      b.totalPrice,
      b.platformFee,
      b.hotelAmount,
      b.discountAmount,
      b.couponCode,
      b.stripePaymentId,
      b.createdAt.toISOString(),
    ]
      .map(cell)
      .join(','),
  )
  // BOM so Excel opens UTF-8 (Arabic names) correctly.
  return '﻿' + [header.join(','), ...lines].join('\r\n')
}
