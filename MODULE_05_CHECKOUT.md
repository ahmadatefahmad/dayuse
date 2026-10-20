# MODULE 05 — Booking, Checkout & Stripe

> **Read README.md first.** Modules 01–04 must be complete.

## Your Job

Build the full checkout flow: 4-step process from booking details to Stripe payment to confirmation. Also handle Stripe webhooks, booking confirmation, and change requests.

---

## Routes to Build

| Route | Purpose |
|---|---|
| `/checkout` | 4-step checkout flow |
| `/booking/[id]` | Booking confirmation page |
| `/booking/[id]/change` | Change date or package |
| `POST /api/bookings` | Create booking + Stripe PaymentIntent |
| `POST /api/webhooks/stripe` | Handle Stripe events |
| `PATCH /api/bookings/[id]` | Cancel or change booking |

---

## Checkout Flow (`app/(public)/checkout/page.tsx`)

4-step stepper. State managed with Zustand store.

### Step 1: Review Booking
Show summary: property name, date, package, guests, add-ons, price breakdown.
Availability re-check (call API again before proceeding — guard against race condition).

### Step 2: Guest Details
Fields:
- Full name (required)
- Email (required, valid email)
- Phone (required, Egyptian format: +20...)
- Special requests (textarea, optional)

If user is logged in, pre-fill from their profile.

### Step 3: Coupon + Final Price
- Coupon code input → `POST /api/coupons/validate`
- If valid: show discount applied, recalculate total
- Show final price breakdown:
  - Subtotal
  - Discount (if coupon)
  - **Total: EGP ___**
  - **Pay online now (booking fee): EGP ___**  ← Stripe charges this
  - **Pay on arrival: EGP ___**

### Step 4: Payment
- Stripe Elements (Card element or Payment Element)
- "Pay EGP ___" button (coral, full width)
- On success → create booking record → redirect to `/booking/[id]`

---

## Booking Creation Flow

1. Guest clicks "Pay" → frontend calls `POST /api/bookings` with all booking data
2. Server creates Stripe PaymentIntent for `platform_fee` amount
3. Server creates `Booking` record with `status = pending`, `stripePaymentId`
4. Returns `clientSecret` to frontend
5. Frontend confirms payment with Stripe Elements
6. Stripe fires `payment_intent.succeeded` webhook
7. Webhook handler sets `booking.status = confirmed`
8. Webhook triggers notification (handled in Module 06)

---

## API: `POST /api/bookings`

```ts
// Validate all input with Zod
// Re-check availability (capacity + blackout) — return 409 if unavailable
// Look up pricing for date + package
// Calculate:
//   subtotal = (adultPrice × adults) + (childPrice × children) + addOnTotal
//   discountAmount = apply coupon if provided
//   totalPrice = subtotal - discountAmount
//   platformFee = Math.round(totalPrice * 0.15)   // 15% — adjust as needed
//   hotelAmount = totalPrice - platformFee
// Create Stripe PaymentIntent: amount = platformFee (in piastres: × 100), currency = 'egp'
// Create Booking in DB with status = 'pending'
// Increment coupon.usedCount if coupon used
// Return { bookingId, clientSecret }
```

## API: `POST /api/webhooks/stripe`

```ts
// Verify Stripe signature: stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)
// Handle events:
//   payment_intent.succeeded → booking.status = 'confirmed'
//   payment_intent.payment_failed → booking.status = 'cancelled' (or keep pending for retry)
//   refund.created → log refundId
// Return 200 quickly (no heavy processing here — queue notifications in Module 06)
```

Raw body parsing required: add `export const config = { api: { bodyParser: false } }` in Next.js route config, or use `request.text()` in App Router.

---

## Coupon Validation: `POST /api/coupons/validate`

```ts
// Input: { code, totalPrice }
// Find coupon where code = input, active = true
// Check: not expired, usedCount < maxUses (if set), totalPrice >= minBookingTotal (if set)
// Calculate discount:
//   type = 'percent' → discount = totalPrice × (value / 100)
//   type = 'fixed'   → discount = Math.min(value, totalPrice)
// Return { valid: true, discount, finalPrice } or { valid: false, reason }
```

---

## Booking Confirmation Page (`/booking/[id]`)

```
✅ Booking Confirmed!
[Booking reference number]
[Property name + date]
[Package + guests]
[Price breakdown]
[Pay on arrival reminder box — coral/teal highlighted]
[Add to calendar button]
[Back to home button]
```

Fetch booking by ID. If `status !== confirmed` show "Booking pending" state.

---

## Change Request (`/booking/[id]/change`)

Only accessible if `booking.status = confirmed` and `booking.bookingDate > today`.

Form:
- New date picker (shows same availability logic)
- New package selector (optional)
- Shows new total vs old total
- If more → "You'll be charged EGP X extra"
- If less → "You'll receive a refund of EGP X"

```ts
// PATCH /api/bookings/[id]  with { action: 'change', newDate, newPackageId }
// Calculate new price
// If priceDiff > 0: create new Stripe PaymentIntent for diff, confirm it
// If priceDiff < 0: stripe.refunds.create({ payment_intent: booking.stripePaymentId, amount: |diff| × 100 })
// Create BookingChange record
// Update Booking: date, packageId, totalPrice, platformFee, hotelAmount, status = 'changed' → then 'confirmed'
```

---

## Cancel Booking

```ts
// PATCH /api/bookings/[id]  with { action: 'cancel' }
// Only if status = confirmed
// stripe.refunds.create({ payment_intent: booking.stripePaymentId })  — full platformFee refund
// booking.status = 'cancelled', stripeRefundId = refund.id
```

Note: hotel_amount is never refunded (never charged online).

---

## Zustand Store (`lib/stores/checkoutStore.ts`)

```ts
interface CheckoutState {
  propertyId: string | null
  packageId: string | null
  date: string | null
  adults: number
  children: number
  infants: number
  addOns: { addOnId: string; qty: number; price: number }[]
  guestName: string
  guestEmail: string
  guestPhone: string
  specialRequests: string
  couponCode: string | null
  discountAmount: number
  totalPrice: number
  platformFee: number
  hotelAmount: number
  step: 1 | 2 | 3 | 4
  // actions...
}
```

---

## Update README.md

When done, change Module 05 status from ⬜ to ✅.

## Hands the baton to

MODULE_06_NOTIFICATIONS.md
