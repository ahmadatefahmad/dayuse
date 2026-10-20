# MODULE 07 — User Account & Post-Booking

> **Read README.md first.** Modules 01–06 must be complete.

## Your Job

Build the guest account area: auth flow (sign up / sign in via Supabase), booking history, review submission, and profile management.

---

## Routes to Build

| Route | Purpose |
|---|---|
| `/login` | Sign in page |
| `/register` | Sign up page |
| `/account` | Redirect to `/account/bookings` |
| `/account/bookings` | Booking history |
| `/account/bookings/[id]` | Single booking detail |
| `/account/reviews` | My reviews |
| `/account/reviews/new` | Write a review |
| `/account/profile` | Edit profile |

---

## Auth (`/login` + `/register`)

Use Supabase Auth (email/password). UI: simple centered card, navy header.

**Sign up form:**
- Full name
- Email
- Password (min 8 chars)
- Phone number (optional)
- Submit → `supabase.auth.signUp()` → create `User` record in DB

**Sign in form:**
- Email
- Password
- "Forgot password?" link
- Submit → `supabase.auth.signInWithPassword()`

After auth: redirect to previous page or `/account`.

Middleware (`middleware.ts`):
```ts
// Protect /account/* routes
// If no session → redirect /login?redirect=/account/...
```

---

## Booking History (`/account/bookings`)

Tabs: Upcoming / Past / Cancelled

Each booking card:
```
[Property cover image — small]
[Property name]                    [Status badge]
[Package name]
[Date]  [Adults: X | Children: Y]
[Total: EGP ___]  [Paid online: EGP ___]
[Buttons: View details | Cancel (if upcoming) | Write review (if eligible)]
```

Fetch from `GET /api/account/bookings` (filtered by userId from session).

---

## Single Booking (`/account/bookings/[id]`)

Full booking detail:
- All booking info
- Status timeline (placed → confirmed → completed)
- Payment summary
- "Cancel booking" button (if `status = confirmed` and `bookingDate > today`)
- "Change booking" button → `/booking/[id]/change`
- "Write a review" button (if eligible)

---

## Review Submission (`/account/reviews/new?bookingId=xxx`)

**Eligibility check (server-side):**
```ts
// booking.userId === session.userId
// booking.status === 'confirmed'
// booking.bookingDate < today
// no existing review for this bookingId
// if any check fails → redirect /account/bookings
```

**Review form:**
```
Property: [Property name — read only]
Date visited: [booking date — read only]
Overall rating: ★★★★★ (clickable stars)
Title: [text input]
Your review: [textarea, min 50 chars]
[Submit Review]
```

Note below form: "Reviews are checked by our team before being published."

`POST /api/reviews`:
```ts
// Validate input
// Re-check eligibility server-side
// prisma.review.create({ status: 'pending' })
// Return success
```

---

## My Reviews (`/account/reviews`)

List of reviews the user submitted. Shows status badge: Pending / Published / Rejected.
If rejected, show admin note (if any).

---

## Profile (`/account/profile`)

Edit:
- Full name
- Phone number
- Password change (current password + new password)

`PATCH /api/account/profile`:
- Update `User` record
- If password change: `supabase.auth.updateUser({ password: newPassword })`

---

## API Routes

### `GET /api/account/bookings`
Returns bookings for the authenticated user. Include property + package info.

### `GET /api/account/bookings/[id]`
Single booking. Verify `userId` matches session user.

### `POST /api/reviews`
Create review. All eligibility checks here.

### `GET /api/account/reviews`
Returns all reviews submitted by user.

### `PATCH /api/account/profile`
Update user profile.

---

## Session Utilities (`lib/auth.ts`)

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function getSession() {
  const supabase = createServerClient(...)
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}
```

---

## Update README.md

When done, change Module 07 status from ⬜ to ✅.

## Hands the baton to

MODULE_08_ADMIN_BOOKINGS.md
