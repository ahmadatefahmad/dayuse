# MODULE 08 — Admin: Bookings, Reviews & Coupons

> **Read README.md first.** Modules 01–07 must be complete.

## Your Job

Complete the admin dashboard with booking management, review moderation, coupon management, and the KPI dashboard.

---

## Routes to Build

| Route | Purpose |
|---|---|
| `/admin/dashboard` | KPI overview |
| `/admin/bookings` | All bookings table |
| `/admin/bookings/[id]` | Booking detail + actions |
| `/admin/reviews` | Review moderation queue |
| `/admin/coupons` | Coupon list + create |
| `/admin/notifications` | Notification log |

---

## KPI Dashboard (`/admin/dashboard`)

Use `KpiCard` component (built in Module 02).

KPIs to show:
- **Today's bookings** (count)
- **This month revenue** (sum of platform_fee where status = confirmed/completed)
- **Total active properties**
- **Pending reviews** (count where status = pending)
- **This month bookings** (count)
- **Cancellation rate** (cancelled / total this month, %)

Below KPIs:
- Recent bookings table (last 10, with link to detail)
- Mini chart: bookings per day last 30 days (simple CSS bar chart or use a lightweight charting lib)

All data from Prisma queries. Server component.

---

## Bookings Table (`/admin/bookings`)

Full table with:
- Columns: Booking ID (short), Guest name, Property, Date, Package, Adults, Total, Status, Created
- Filter by: Status / Property / Date range / Search (guest name/email)
- Sort by: Date / Created / Total
- Pagination (25 per page)
- Each row links to `/admin/bookings/[id]`
- Export to CSV button (generate CSV from current filter)

Status badges:
- pending → grey
- confirmed → teal
- cancelled → red
- completed → navy
- changed → yellow

---

## Booking Detail (`/admin/bookings/[id]`)

Show all booking fields. Plus admin actions:

**Actions panel:**
- **Mark as completed** (if status = confirmed and bookingDate <= today)
- **Cancel booking** (triggers Stripe refund + notification)
- **Add internal note** (text field, saves to `internalNotes`)

**Payment info:**
- Stripe Payment ID (with link to Stripe dashboard)
- Platform fee collected
- Hotel amount (for reference)
- Refund ID (if cancelled)

---

## Review Moderation (`/admin/reviews`)

Two-tab view: **Pending** / **All**

Pending queue — each card shows:
```
[Property name]  [Guest name]  [Date submitted]
[★★★★☆ 4/5]
[Title]
[Body text]
[APPROVE button (teal)] [REJECT button (red)]
[Admin note input — shown on reject]
```

On approve: `review.status = 'approved'` — review now visible on property page.
On reject: `review.status = 'rejected'`, save `adminNote`.

API:
```
PATCH /api/admin/reviews/[id]  { action: 'approve' | 'reject', adminNote? }
```

---

## Coupon Management (`/admin/coupons`)

Table of all coupons: Code / Type / Value / Min total / Uses / Expires / Active

**Create coupon form (modal):**
```
Code:           [text — auto-suggest random code]
Type:           [Percent | Fixed Amount]
Value:          [number] (% or EGP)
Min total:      [EGP — optional]
Max uses:       [number — optional, leave empty for unlimited]
Expiry date:    [date picker — optional]
Active:         [toggle]
```

Validation:
- Code must be unique (check on submit)
- Percent: 1–100
- Fixed: must be less than a reasonable max

API:
```
GET  /api/admin/coupons
POST /api/admin/coupons
PATCH /api/admin/coupons/[id]  { active: false }  (deactivate)
```

---

## Notification Log (`/admin/notifications`)

Already spec'd in Module 06. Just build the UI here if not done:

Table: Recipient / Channel / Type / Status / Sent At / Error (if failed)
Filter by: Channel / Status / Type
Show 100 rows. No pagination needed — just most recent.

---

## API Routes

### `GET /api/admin/bookings`
Full query with filters. Admin only.

### `PATCH /api/admin/bookings/[id]`
Actions: `{ action: 'complete' | 'cancel' | 'note', note? }`
Cancel triggers Stripe refund (same logic as guest cancel in Module 05).

### `GET /api/admin/reviews`
All reviews, filtered by status.

### `PATCH /api/admin/reviews/[id]`
Approve or reject.

### `GET /api/admin/coupons`
All coupons.

### `POST /api/admin/coupons`
Create coupon. Validate uniqueness.

### `PATCH /api/admin/coupons/[id]`
Toggle active.

### `GET /api/admin/stats`
Returns KPI numbers. Used by dashboard.

---

## CSV Export

Simple implementation:
```ts
// In GET /api/admin/bookings?export=csv
// Build CSV string from query results
// Return with headers: Content-Type: text/csv, Content-Disposition: attachment; filename=bookings.csv
```

---

## Update README.md

When done, change Module 08 status from ⬜ to ✅.

## Hands the baton to

MODULE_09_QA.md
