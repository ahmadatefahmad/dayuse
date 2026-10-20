import { format, parseISO } from 'date-fns'
import prisma from '@/lib/prisma'
import { bookingPath } from '@/lib/booking-access'
import { bookingReference, formatLocation, guestSummary } from '@/lib/booking-format'
import type { AddOnLine } from '@/lib/booking-quote'
import { sendEmail, type SendResult } from '@/lib/email'
import {
  adminBookingHtml,
  arrivalReminderHtml,
  bookingCancelledHtml,
  bookingChangedHtml,
  bookingConfirmedHtml,
  reviewRequestHtml,
  type AdminEvent,
  type EmailBooking,
  type EmailChange,
} from '@/lib/email-templates/bookings'
import { formatEGP, toDateString } from '@/lib/utils'
import { sendWhatsApp, type WhatsAppTemplate } from '@/lib/whatsapp'

export type NotificationType = 'booking_confirmed' | 'booking_cancelled' | 'booking_changed' | 'review_request' | 'arrival_reminder'
type Channel = 'email' | 'whatsapp'

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const longDate = (d: Date) => format(parseISO(toDateString(d)), 'EEEE d MMMM yyyy')

async function loadBooking(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      property: { select: { name: true, address: true, area: true, city: true, availabilityWindows: { take: 1, select: { startTime: true, endTime: true } } } },
      package: { select: { name: true } },
      changeHistory: { orderBy: { changedAt: 'desc' }, take: 1 },
    },
  })
}
type LoadedBooking = NonNullable<Awaited<ReturnType<typeof loadBooking>>>

export function toEmailBooking(b: LoadedBooking): EmailBooking {
  const window = b.property.availabilityWindows[0]
  const addOns = (b.addOns as AddOnLine[] | null) ?? []
  return {
    reference: bookingReference(b.id),
    guestName: b.guestName,
    guestEmail: b.guestEmail,
    guestPhone: b.guestPhone,
    propertyName: b.property.name,
    location: formatLocation(b.property.address, b.property.area, b.property.city),
    date: longDate(b.bookingDate),
    hours: window ? `${window.startTime}–${window.endTime}` : null,
    packageName: b.package.name,
    guests: guestSummary(b),
    extras: addOns.length ? addOns.map((a) => (a.qty > 1 ? `${a.name} × ${a.qty}` : a.name)).join(', ') : null,
    specialRequests: b.specialRequests,
    total: formatEGP(b.totalPrice),
    paidOnline: formatEGP(b.platformFee),
    dueOnArrival: formatEGP(b.hotelAmount),
    discount: b.discountAmount > 0 ? `−${formatEGP(b.discountAmount)}${b.couponCode ? ` (${b.couponCode})` : ''}` : null,
    link: `${appUrl()}${bookingPath(b.id, b.accessToken)}`,
  }
}

async function describeChange(b: LoadedBooking): Promise<EmailChange | undefined> {
  const c = b.changeHistory[0]
  if (!c) return undefined
  const ids = [c.oldPackageId, c.newPackageId].filter((id): id is string => Boolean(id))
  const pkgs = await prisma.package.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })
  const name = (id: string | null) => pkgs.find((p) => p.id === id)?.name ?? null
  const feeDiffText = c.priceDiff > 0 ? `${formatEGP(c.priceDiff)} extra was charged online.` : c.priceDiff < 0 ? `${formatEGP(-c.priceDiff)} is being refunded to your card.` : 'The booking fee is unchanged.'
  return {
    oldDate: c.oldDate ? longDate(c.oldDate) : '',
    newDate: c.newDate ? longDate(c.newDate) : '',
    oldPackage: name(c.oldPackageId),
    newPackage: name(c.newPackageId),
    feeDiff: c.priceDiff,
    feeDiffText,
  }
}

// Sends one message and records the attempt in NotificationLog, success or not.
async function deliver(bookingId: string, type: NotificationType, channel: Channel, recipient: string, send: () => Promise<SendResult>) {
  const result = await send()
  await prisma.notificationLog.create({
    data: { bookingId, type, channel, recipient, status: result.ok ? 'sent' : 'failed', error: result.ok ? null : result.error },
  })
  if (!result.ok) console.warn(`[notify] ${type} via ${channel} to ${recipient} failed: ${result.error}`)
  return result
}

// One-off messages (confirmation, reminder, review request) are never sent twice on the same channel.
async function alreadySent(bookingId: string, type: NotificationType, channel: Channel) {
  return (await prisma.notificationLog.count({ where: { bookingId, type, channel, status: 'sent' } })) > 0
}

type Plan = {
  type: NotificationType
  once?: boolean
  guestSubject?: string
  guestHtml?: string
  whatsapp?: { template: WhatsAppTemplate; params: string[] }
  admin?: { event: AdminEvent; change?: EmailChange }
}

async function run(b: LoadedBooking, plan: Plan) {
  const email = toEmailBooking(b)
  const jobs: Promise<unknown>[] = []
  const skip = async (channel: Channel) => plan.once && (await alreadySent(b.id, plan.type, channel))

  if (plan.guestSubject && plan.guestHtml && !(await skip('email'))) {
    jobs.push(deliver(b.id, plan.type, 'email', b.guestEmail, () => sendEmail(b.guestEmail, plan.guestSubject!, plan.guestHtml!)))
  }
  if (plan.whatsapp && b.guestPhone && !(await skip('whatsapp'))) {
    jobs.push(deliver(b.id, plan.type, 'whatsapp', b.guestPhone, () => sendWhatsApp(b.guestPhone, plan.whatsapp!.template, plan.whatsapp!.params)))
  }
  if (plan.admin) {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL
    const subject = `[DayUse] ${{ new: 'New booking', cancelled: 'Cancelled', changed: 'Changed' }[plan.admin.event]} — ${b.property.name}, ${email.date} (${email.reference})`
    jobs.push(
      deliver(b.id, plan.type, 'email', adminEmail || '(admin email not set)', async () =>
        adminEmail ? sendEmail(adminEmail, subject, adminBookingHtml(email, plan.admin!.event, plan.admin!.change)) : { ok: false, error: 'ADMIN_NOTIFICATION_EMAIL is not configured' },
      ),
    )
  }
  await Promise.all(jobs)
}

export async function sendBookingConfirmed(bookingId: string) {
  const b = await loadBooking(bookingId)
  if (!b) return
  const e = toEmailBooking(b)
  // Admin copy goes out only alongside the first successful guest confirmation attempt.
  const firstTime = !(await alreadySent(b.id, 'booking_confirmed', 'email'))
  await run(b, {
    type: 'booking_confirmed',
    once: true,
    guestSubject: `Booking confirmed — ${b.property.name}, ${e.date}`,
    guestHtml: bookingConfirmedHtml(e),
    whatsapp: { template: 'booking_confirmed', params: [b.guestName, b.property.name, e.date, e.total, e.paidOnline] },
    admin: firstTime ? { event: 'new' } : undefined,
  })
}

export async function sendBookingCancelled(bookingId: string) {
  const b = await loadBooking(bookingId)
  if (!b) return
  const e = toEmailBooking(b)
  await run(b, {
    type: 'booking_cancelled',
    once: true,
    guestSubject: `Booking cancelled — ${b.property.name} (${e.reference})`,
    guestHtml: bookingCancelledHtml(e),
    whatsapp: { template: 'booking_cancelled', params: [b.guestName, b.property.name, e.date] },
    admin: { event: 'cancelled' },
  })
}

export async function sendBookingChanged(bookingId: string) {
  const b = await loadBooking(bookingId)
  if (!b) return
  const e = toEmailBooking(b)
  const change = await describeChange(b)
  await run(b, {
    type: 'booking_changed',
    guestSubject: `Booking updated — ${b.property.name}, now ${e.date}`,
    guestHtml: bookingChangedHtml(e, change ?? { oldDate: '', newDate: e.date, oldPackage: null, newPackage: null, feeDiff: 0, feeDiffText: '' }),
    whatsapp: { template: 'booking_changed', params: [b.guestName, b.property.name, e.date] },
    admin: { event: 'changed', change },
  })
}

export async function sendReviewRequest(bookingId: string) {
  const b = await loadBooking(bookingId)
  if (!b) return
  const reviewLink = `${appUrl()}/account/reviews/new?bookingId=${b.id}`
  await run(b, {
    type: 'review_request',
    once: true,
    guestSubject: `How was ${b.property.name}?`,
    guestHtml: reviewRequestHtml(toEmailBooking(b), reviewLink),
    whatsapp: { template: 'review_request', params: [b.guestName, b.property.name, reviewLink] },
  })
}

export async function sendArrivalReminder(bookingId: string) {
  const b = await loadBooking(bookingId)
  if (!b) return
  const e = toEmailBooking(b)
  await run(b, {
    type: 'arrival_reminder',
    once: true,
    guestSubject: `Tomorrow: your day at ${b.property.name}`,
    guestHtml: arrivalReminderHtml(e),
    whatsapp: { template: 'arrival_reminder', params: [b.guestName, b.property.name, e.date, e.dueOnArrival] },
  })
}

export { loadBooking as loadBookingForNotification }
