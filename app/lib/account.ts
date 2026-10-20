import type { User } from '@supabase/supabase-js'
import prisma from '@/lib/prisma'
import { fromDateString, todayInEgypt } from '@/lib/utils'

// Statuses a guest can review once the visit date has passed (README rule 3).
export const REVIEWABLE_STATUSES = ['confirmed', 'completed']

// Makes sure the signed-in Supabase user has a matching User row (bookings and reviews reference it).
// Once the email is confirmed, bookings made earlier as a guest with that email are attached too.
export async function ensureUserRecord(user: User) {
  if (!user.email) return null
  const meta = user.user_metadata ?? {}
  const record = await prisma.user.upsert({
    where: { id: user.id },
    update: { email: user.email },
    create: {
      id: user.id,
      email: user.email,
      name: typeof meta.full_name === 'string' ? meta.full_name : null,
      phone: typeof meta.phone === 'string' && meta.phone ? meta.phone : null,
    },
  })
  if (user.email_confirmed_at) {
    await prisma.booking.updateMany({ where: { userId: null, guestEmail: { equals: user.email, mode: 'insensitive' } }, data: { userId: user.id } })
  }
  return record
}

export type BookingTab = 'upcoming' | 'past' | 'cancelled'
export const BOOKING_TABS: BookingTab[] = ['upcoming', 'past', 'cancelled']

// Unpaid (pending) bookings are abandoned checkouts and never shown to the guest.
export function bookingTabWhere(tab: BookingTab) {
  const today = fromDateString(todayInEgypt())
  if (tab === 'cancelled') return { status: 'cancelled' }
  if (tab === 'past') return { status: { in: ['confirmed', 'completed'] }, bookingDate: { lt: today } }
  return { status: { in: ['confirmed', 'completed'] }, bookingDate: { gte: today } }
}

export async function listUserBookings(userId: string, tab: BookingTab) {
  return prisma.booking.findMany({
    where: { userId, ...bookingTabWhere(tab) },
    orderBy: { bookingDate: tab === 'upcoming' ? 'asc' : 'desc' },
    include: {
      property: { select: { id: true, name: true, coverImage: true, city: true, area: true } },
      package: { select: { name: true } },
      reviews: { select: { id: true } },
    },
  })
}

export async function getUserBooking(userId: string, bookingId: string) {
  return prisma.booking.findFirst({
    where: { id: bookingId, userId },
    include: {
      property: { select: { id: true, name: true, coverImage: true, city: true, area: true, address: true, availabilityWindows: { take: 1 } } },
      package: { select: { name: true, inclusions: true } },
      reviews: { select: { id: true, status: true } },
      changeHistory: { orderBy: { changedAt: 'asc' } },
    },
  })
}

// A booking the user may review: theirs, visited (date before today), confirmed/completed, not yet reviewed.
export async function findReviewableBooking(userId: string, bookingId: string) {
  return prisma.booking.findFirst({
    where: {
      id: bookingId,
      userId,
      status: { in: REVIEWABLE_STATUSES },
      bookingDate: { lt: fromDateString(todayInEgypt()) },
      reviews: { none: {} },
    },
    include: { property: { select: { id: true, name: true, coverImage: true } }, package: { select: { name: true } } },
  })
}

export const canReview = (b: { status: string; bookingDate: Date; reviews: unknown[] }) =>
  REVIEWABLE_STATUSES.includes(b.status) && b.bookingDate < fromDateString(todayInEgypt()) && b.reviews.length === 0
