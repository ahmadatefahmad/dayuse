import { NextResponse, type NextRequest } from 'next/server'
import { jsonError, requireAdmin } from '@/lib/api'
import {
  adminBookingHtml,
  arrivalReminderHtml,
  bookingCancelledHtml,
  bookingChangedHtml,
  bookingConfirmedHtml,
  reviewRequestHtml,
  type EmailBooking,
  type EmailChange,
} from '@/lib/email-templates/bookings'

const SAMPLE: EmailBooking = {
  reference: 'DU-SAMPLE01',
  guestName: 'Mona Khaled',
  guestEmail: 'mona@example.com',
  guestPhone: '+201012345678',
  propertyName: 'Palm Lagoon Resort',
  location: 'El Gouna, Hurghada',
  date: 'Friday 25 December 2026',
  hours: '09:00–18:00',
  packageName: 'Lagoon Day Pass',
  guests: '2 adults, 1 child',
  extras: 'Lunch upgrade × 3',
  specialRequests: 'Celebrating a birthday <3 — a cake if possible!',
  total: 'EGP 6,550',
  paidOnline: 'EGP 983',
  dueOnArrival: 'EGP 5,567',
  discount: null,
  link: '#',
}
const CHANGE: EmailChange = { oldDate: 'Tuesday 22 December 2026', newDate: SAMPLE.date, oldPackage: 'Lagoon Day Pass', newPackage: 'Lagoon Day Pass', feeDiff: 150, feeDiffText: 'EGP 150 extra was charged online.' }

const TEMPLATES: Record<string, () => string> = {
  booking_confirmed: () => bookingConfirmedHtml(SAMPLE),
  booking_cancelled: () => bookingCancelledHtml(SAMPLE),
  booking_changed: () => bookingChangedHtml(SAMPLE, CHANGE),
  arrival_reminder: () => arrivalReminderHtml(SAMPLE),
  review_request: () => reviewRequestHtml(SAMPLE, '#'),
  admin_new: () => adminBookingHtml(SAMPLE, 'new'),
  admin_changed: () => adminBookingHtml(SAMPLE, 'changed', CHANGE),
  admin_cancelled: () => adminBookingHtml(SAMPLE, 'cancelled'),
}

// GET ?template=booking_confirmed -> the rendered email with sample data (admin only).
export async function GET(request: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied
  const render = TEMPLATES[request.nextUrl.searchParams.get('template') ?? '']
  if (!render) return jsonError(`Unknown template. Use one of: ${Object.keys(TEMPLATES).join(', ')}`, 400)
  return new NextResponse(render(), { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
