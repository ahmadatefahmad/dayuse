# MODULE 06 — Notifications (Email + WhatsApp)

> **Read README.md first.** Module 05 (Checkout) must be complete.

## Your Job

Build the notification system. Triggered after booking events, notifications go to:
- **Guest:** email always; WhatsApp if phone provided
- **Admin/Hotel team:** email for new bookings, cancellations, changes

---

## Notification Events

| Event | Guest Email | Guest WhatsApp | Admin Email |
|---|---|---|---|
| Booking confirmed | ✅ | ✅ | ✅ |
| Booking cancelled | ✅ | ✅ | ✅ |
| Booking changed | ✅ | ✅ | ✅ |
| Review request (3 days after visit) | ✅ | ✅ | ❌ |
| Payment reminder (1 day before) | ✅ | ✅ | ❌ |

---

## File: `lib/notifications.ts`

Central module. Exports one function per event type.

```ts
export async function sendBookingConfirmed(bookingId: string): Promise<void>
export async function sendBookingCancelled(bookingId: string): Promise<void>
export async function sendBookingChanged(bookingId: string): Promise<void>
export async function sendReviewRequest(bookingId: string): Promise<void>
```

Each function:
1. Fetches booking from DB (include property, package)
2. Sends guest email via Resend
3. Sends guest WhatsApp if phone exists
4. Sends admin email
5. Logs each send attempt to `NotificationLog`

---

## Email via Resend

```ts
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

// Example: booking confirmed
await resend.emails.send({
  from: 'DayUse Egypt <bookings@yourdomain.com>',
  to: booking.guestEmail,
  subject: `Booking Confirmed — ${property.name}`,
  html: bookingConfirmedHtml(booking, property),
})
```

Build email templates as functions returning HTML strings. Keep them simple: branded header (navy), content, CTA button (coral), footer.

Templates needed:
- `bookingConfirmedHtml(booking, property)` — confirmation with all details + pay-on-arrival box
- `bookingCancelledHtml(booking, property)` — cancelled + refund info
- `bookingChangedHtml(booking, property, change)` — what changed + new details
- `reviewRequestHtml(booking, property)` — ask for review + direct link
- `adminNewBookingHtml(booking, property)` — full booking details for admin

Put templates in `lib/email-templates/`.

---

## WhatsApp via 360dialog

360dialog uses a WhatsApp Business API with template messages. Templates must be pre-approved.

```ts
// lib/whatsapp.ts
export async function sendWhatsApp(to: string, templateName: string, params: string[]) {
  const response = await fetch('https://waba.360dialog.io/v1/messages', {
    method: 'POST',
    headers: {
      'D360-API-KEY': process.env.WHATSAPP_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: to.replace(/^\+/, ''), // remove leading +
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components: [{
          type: 'body',
          parameters: params.map(p => ({ type: 'text', text: p })),
        }],
      },
    }),
  })
  // log result
}
```

Templates to register with 360dialog:
- `booking_confirmed` — params: [guestName, propertyName, date, totalPrice, platformFee]
- `booking_cancelled` — params: [guestName, propertyName, date]
- `booking_changed` — params: [guestName, propertyName, newDate]
- `review_request` — params: [guestName, propertyName, reviewLink]

**Note:** If 360dialog isn't set up yet, wrap in try/catch and log failures. Don't block booking flow.

---

## Trigger Points

### From Stripe webhook (`/api/webhooks/stripe`):
```ts
case 'payment_intent.succeeded':
  await sendBookingConfirmed(bookingId)
  break
```

### From cancel API:
```ts
await sendBookingCancelled(bookingId)
```

### From change API:
```ts
await sendBookingChanged(bookingId)
```

### Scheduled: Review Request

3 days after `bookingDate`, send review request if no review exists yet.

Option A (simple): cron job via Vercel Cron (add to `vercel.json`):
```json
{
  "crons": [{ "path": "/api/cron/review-requests", "schedule": "0 10 * * *" }]
}
```

`/api/cron/review-requests`:
```ts
// Find bookings where:
//   status = 'confirmed'
//   bookingDate = today - 3 days
//   no review exists
// For each: sendReviewRequest(bookingId)
// Protect with CRON_SECRET header check
```

---

## Notification Log

After every send attempt:
```ts
await prisma.notificationLog.create({
  data: {
    bookingId,
    recipient: email_or_phone,
    channel: 'email' | 'whatsapp',
    type: 'booking_confirmed' | ...,
    status: success ? 'sent' : 'failed',
    error: error?.message,
  }
})
```

---

## Admin Notification Page (`/admin/notifications`)

Table of `NotificationLog` records. Filter by channel, type, status. Shows last 200 entries. Useful for debugging.

---

## Update README.md

When done, change Module 06 status from ⬜ to ✅.

## Hands the baton to

MODULE_07_ACCOUNT.md
