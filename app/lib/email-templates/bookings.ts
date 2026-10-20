import { button, COLORS, details, esc, layout, paymentSplit } from '@/lib/email-templates/layout'

// Everything a template needs, already formatted. Built by lib/notifications.ts.
export type EmailBooking = {
  reference: string
  guestName: string
  guestEmail: string
  guestPhone: string
  propertyName: string
  location: string
  date: string // "Tuesday 22 December 2026"
  hours: string | null
  packageName: string
  guests: string
  extras: string | null
  specialRequests: string | null
  total: string
  paidOnline: string
  dueOnArrival: string
  discount: string | null
  link: string // guest's booking page (includes access token)
}

export type EmailChange = { oldDate: string; newDate: string; oldPackage: string | null; newPackage: string | null; feeDiff: number; feeDiffText: string }

const firstName = (name: string) => name.trim().split(/\s+/)[0]

function bookingRows(b: EmailBooking): [string, string][] {
  return [
    ['Reference', b.reference],
    ['Date', b.date],
    ...(b.hours ? [['Hours', b.hours] as [string, string]] : []),
    ['Package', b.packageName],
    ['Guests', b.guests],
    ...(b.extras ? [['Extras', b.extras] as [string, string]] : []),
    ...(b.discount ? [['Discount', b.discount] as [string, string]] : []),
    ['Total', b.total],
  ]
}

export function bookingConfirmedHtml(b: EmailBooking) {
  return layout({
    preheader: `Your day at ${b.propertyName} on ${b.date} is booked.`,
    title: `You're booked at ${b.propertyName}!`,
    body: `<p>Hi ${esc(firstName(b.guestName))}, your day pass is confirmed. See you on <strong>${esc(b.date)}</strong>.</p>
${details(bookingRows(b))}
${paymentSplit(b.paidOnline, b.dueOnArrival, b.propertyName)}
<p style="margin:0">Show reference <strong>${esc(b.reference)}</strong> at reception. Address: ${esc(b.location)}.</p>
${button(b.link, 'View your booking')}
<p style="font-size:13px;color:${COLORS.grey500}">Plans changed? Changes are free, and you can cancel before your visit for a refund of the booking fee — all from your booking page.</p>`,
  })
}

export function bookingCancelledHtml(b: EmailBooking) {
  return layout({
    preheader: `Your booking ${b.reference} has been cancelled.`,
    title: 'Your booking is cancelled',
    body: `<p>Hi ${esc(firstName(b.guestName))}, we've cancelled your day at <strong>${esc(b.propertyName)}</strong> on ${esc(b.date)} (reference ${esc(b.reference)}).</p>
<p>Your online booking fee of <strong>${esc(b.paidOnline)}</strong> is being refunded to your card. It usually appears within 5–10 business days. Nothing is owed to the hotel.</p>
${button(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/search`, 'Find another escape')}`,
  })
}

export function bookingChangedHtml(b: EmailBooking, c: EmailChange) {
  const what = [c.oldDate !== c.newDate && `date from ${c.oldDate} to <strong>${esc(c.newDate)}</strong>`, c.oldPackage !== c.newPackage && c.newPackage && `package to <strong>${esc(c.newPackage)}</strong>`]
    .filter(Boolean)
    .join(' and ')
  return layout({
    preheader: `Your booking ${b.reference} now falls on ${b.date}.`,
    title: 'Your booking has been updated',
    body: `<p>Hi ${esc(firstName(b.guestName))}, we've changed the ${what || 'details'} of your booking at <strong>${esc(b.propertyName)}</strong>.</p>
${c.feeDiff !== 0 ? `<p>${esc(c.feeDiffText)}</p>` : ''}
${details(bookingRows(b))}
${paymentSplit(b.paidOnline, b.dueOnArrival, b.propertyName)}
${button(b.link, 'View your booking')}`,
  })
}

export function arrivalReminderHtml(b: EmailBooking) {
  return layout({
    preheader: `Tomorrow: your day at ${b.propertyName}. Bring ${b.dueOnArrival} for the hotel.`,
    title: `See you tomorrow at ${b.propertyName}`,
    body: `<p>Hi ${esc(firstName(b.guestName))}, a quick reminder that your day pass is tomorrow, <strong>${esc(b.date)}</strong>${b.hours ? `, ${esc(b.hours)}` : ''}.</p>
${paymentSplit(b.paidOnline, b.dueOnArrival, b.propertyName)}
${details([
  ['Reference', b.reference],
  ['Guests', b.guests],
  ['Address', b.location],
])}
<p>Pack your swimwear and sunscreen!</p>
${button(b.link, 'View your booking')}`,
  })
}

export function reviewRequestHtml(b: EmailBooking, reviewLink: string) {
  return layout({
    preheader: `How was your day at ${b.propertyName}?`,
    title: `How was ${b.propertyName}?`,
    body: `<p>Hi ${esc(firstName(b.guestName))}, we hope you had a wonderful day on ${esc(b.date)}.</p>
<p>A quick review helps other guests choose their perfect escape — it takes less than a minute.</p>
${button(reviewLink, 'Write a review')}`,
  })
}

export type AdminEvent = 'new' | 'cancelled' | 'changed'

export function adminBookingHtml(b: EmailBooking, event: AdminEvent, change?: EmailChange) {
  const heading = { new: 'New booking', cancelled: 'Booking cancelled', changed: 'Booking changed' }[event]
  return layout({
    preheader: `${heading}: ${b.propertyName}, ${b.date}, ${b.guests}`,
    title: `${heading} — ${b.propertyName}`,
    body: `${change ? `<p style="background:${COLORS.grey50};padding:12px;border-radius:8px">Was ${esc(change.oldDate)}${change.oldPackage ? ` (${esc(change.oldPackage)})` : ''}. Online fee difference: ${esc(change.feeDiffText)}</p>` : ''}
${details([
  ...bookingRows(b),
  ['Paid online', b.paidOnline],
  ['Due at hotel', b.dueOnArrival],
  ['Guest', b.guestName],
  ['Email', b.guestEmail],
  ['Phone', b.guestPhone],
])}
${b.specialRequests ? `<p><strong>Special requests:</strong><br>${esc(b.specialRequests).replace(/\n/g, '<br>')}</p>` : ''}
${event !== 'cancelled' ? `<p style="font-size:13px;color:${COLORS.grey500}">Remember to pass this to the hotel if they haven't been notified.</p>` : ''}`,
  })
}
