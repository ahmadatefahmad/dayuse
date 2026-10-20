# DayUse Egypt — Master Build Guide

> **How to use this file:** Every Claude Code session that works on this project should read this file first. It is the single source of truth for architecture, module status, decisions made, and what to build next.

---

## What We Are Building

A two-sided marketplace for booking **day-use access** to hotels, beach clubs, and resorts in Egypt. Users pay a small platform booking fee online; the hotel collects the remainder on arrival.

- **Guest app:** Discover → Browse → Book → Pay fee → Arrive → Review
- **Admin dashboard:** Internal tool for our team to manage properties, bookings, reviews, coupons
- **No hotel login in MVP** — our team does all data entry manually

---

## Tech Stack (all free-tier / pay-as-you-go)

| Layer | Tool | Free Tier |
|---|---|---|
| Framework | Next.js 14 (App Router, TypeScript) | Free |
| Database | Supabase (PostgreSQL) | 500MB, 50k MAU |
| Auth | Supabase Auth | Included |
| ORM | Prisma | Free |
| Styling | Tailwind CSS | Free |
| Images | Cloudinary | 25GB storage/bandwidth |
| Payments | Stripe | Pay-per-transaction only |
| Email | Resend | 3,000/month free |
| WhatsApp/SMS | 360dialog or Twilio | Pay-as-you-go |
| Hosting | Vercel (Hobby) | Free |
| State | Zustand | Free |
| Forms | React Hook Form + Zod | Free |
| Date utils | date-fns | Free |
| Carousel | Embla Carousel | Free |

**Total fixed cost at demo phase: $0/month**

---

## Monorepo Structure

```
/
├── app/
│   ├── (public)/           # Guest-facing pages
│   │   ├── page.tsx        # Homepage / search
│   │   ├── search/         # Listing results
│   │   ├── property/[id]/  # Property detail + booking panel
│   │   ├── checkout/       # Multi-step checkout
│   │   ├── booking/[id]/   # Booking confirmation
│   │   └── account/        # User account (bookings, reviews)
│   ├── (admin)/            # Internal dashboard (role-gated)
│   │   ├── dashboard/      # KPIs overview
│   │   ├── properties/     # CRUD properties
│   │   ├── bookings/       # Manage bookings
│   │   ├── reviews/        # Approve/reject queue
│   │   ├── coupons/        # Coupon management
│   │   └── notifications/  # Notification log
│   └── api/                # API route handlers
│       ├── webhooks/stripe/ # Stripe webhook
│       ├── bookings/        # Booking CRUD
│       ├── properties/      # Property queries
│       ├── reviews/         # Review submission
│       └── coupons/         # Coupon validation
├── components/
│   ├── ui/                 # Base components (Button, Input, etc.)
│   ├── property/           # PropertyCard, PropertyGallery, etc.
│   ├── booking/            # BookingPanel, PackageSelector, etc.
│   ├── checkout/           # CheckoutSteps, OrderSummary, etc.
│   └── admin/              # AdminTable, KpiCard, Sidebar, etc.
├── lib/
│   ├── prisma.ts           # Prisma client singleton
│   ├── stripe.ts           # Stripe client
│   ├── cloudinary.ts       # Cloudinary config + upload helper
│   ├── supabase.ts         # Supabase client (server + browser)
│   ├── notifications.ts    # Email + WhatsApp send helpers
│   └── availability.ts     # Date availability logic
├── prisma/
│   ├── schema.prisma       # Full DB schema
│   └── migrations/         # Auto-generated
└── types/
    └── index.ts            # Shared TypeScript types
```

---

## Design System

**Colors**
```
--navy:      #0D1B2A   (primary background, nav, admin sidebar)
--coral:     #E8634A   (CTA buttons, accents)
--teal:      #2BBFA4   (success, tags, admin highlights)
--sand:      #E8D5B0   (hero accents, warm tones)
--white:     #FFFFFF
--grey-50:   #F8F9FA
--grey-100:  #F0F2F4
--grey-300:  #C8CDD4
--grey-500:  #7A8694
--grey-700:  #3D4855
```

**Typography**
- Headlines / property names: `Playfair Display` (serif, editorial)
- All UI / body: `Inter` (sans-serif, clean)

**Design principles**
- Premium travel magazine feel, not a booking utility
- Mobile-first, fully responsive
- Property photos are dominant — always full-bleed in cards
- "Pay now" vs "Pay on arrival" split must always be visible and clear

---

## Business Logic — Critical Rules

1. **Platform fee only charged online.** `bookings.platform_fee` is what Stripe charges. `bookings.hotel_amount` is collected by the hotel on arrival. Guest sees only `bookings.total_price`.
2. **Capacity check before booking.** Count confirmed bookings for that property + date. If >= `availability_windows.max_capacity_adults`, block.
3. **Reviews gated to confirmed bookings.** A review can only be submitted if `booking.status = confirmed` AND `booking.booking_date < today`.
4. **Reviews need admin approval.** `reviews.status` starts as `pending`. Only `approved` reviews are shown publicly.
5. **Blackout dates are hard blocks.** If a date is in `blackout_dates` for a property, it must be disabled on the calendar — no booking allowed regardless of capacity.
6. **Change requests are free.** No fee charged for the change itself. If the new booking costs more → charge the difference via Stripe. If less → refund the difference.
7. **Refunds are platform fee only.** The hotel never touched the online payment, so refunds never involve the hotel.
8. **Coupons apply before the fee split.** Discount the total first, then recalculate the platform fee on the discounted total.
9. **Price is date-sensitive.** Always look up `property_pricing` for the selected date — check `date_override` first, then fall back to `day_of_week`.

---

## Module Build Order

Each module is a separate Claude Code session. Complete in order.

| # | Module | Status | Session file |
|---|---|---|---|
| 1 | Project Setup + Database | ✅ Done | MODULE_01_SETUP.md |
| 2 | Admin — Properties | ✅ Done | MODULE_02_ADMIN_PROPERTIES.md |
| 3 | Guest — Discovery & Listing | ✅ Done | MODULE_03_GUEST_LISTING.md |
| 4 | Guest — Property Detail | ✅ Done | MODULE_04_PROPERTY_DETAIL.md |
| 5 | Booking & Checkout + Stripe | ✅ Done (live Stripe payment untested — needs keys) | MODULE_05_CHECKOUT.md |
| 6 | Notifications (Email + WhatsApp) | ✅ Done (live sends untested — needs Resend / 360dialog keys) | MODULE_06_NOTIFICATIONS.md |
| 7 | User Account + Post-booking | ✅ Done | MODULE_07_ACCOUNT.md |
| 8 | Admin — Bookings, Reviews, Coupons | ✅ Done | MODULE_08_ADMIN_BOOKINGS.md |
| 9 | Polish, Mobile, QA | ✅ Done (deploy needs your accounts — see DEPLOY.md) | MODULE_09_QA.md |

**Update the Status column** as modules complete: ⬜ Todo → 🔄 In progress → ✅ Done

---

## Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Resend (email)
RESEND_API_KEY=

# WhatsApp (360dialog or Twilio)
WHATSAPP_API_KEY=
WHATSAPP_FROM_NUMBER=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Notifications (Module 06)
EMAIL_FROM=                 # e.g. "DayUse Egypt <bookings@yourdomain.com>" (needs a verified Resend domain)
ADMIN_NOTIFICATION_EMAIL=   # team inbox for new/changed/cancelled bookings
CRON_SECRET=                # random string; Vercel Cron sends it as a Bearer token
```

---

## Open Items (must resolve before going live)

- [ ] Cancellation policy: hours threshold for full refund
- [ ] Children age ranges: infant (free) / child / adult cutoffs
- [ ] WhatsApp Business: registered number + approved account
- [ ] Stripe: Egyptian business entity registration
- [ ] Hotel notification: email only or WhatsApp too?
- [ ] Domain + branding: name, domain, logo
- [ ] Admin roles: single level or super-admin vs data-entry?

---

*Last updated: 2026-10-18 — all 9 modules built and tested by Claude Code. Deployment guide: DEPLOY.md*

---

## Decisions Log

- **Module 01:** Next.js pinned to 14 (`create-next-app@14`), Prisma pinned to 6, Stripe SDK pinned to 16 (matches `apiVersion: '2024-06-20'`).
- **Module 01:** `DATABASE_URL` uses the Supabase **Session pooler** (`aws-0-eu-west-1.pooler.supabase.com:5432`, user `postgres.<project-ref>`). The direct `db.<ref>.supabase.co` host is IPv6-only and unreachable from the dev network.
- **Module 02:** Admin role is read from `app_metadata.role`, **not** `user_metadata` — users can edit their own `user_metadata` from the browser. Grant it with `npm run make-admin -- email@example.com` (in `app/`).
- **Module 02:** Pricing and availability saves replace the package's/property's rules in a transaction (Prisma can't upsert on compound uniques containing NULL columns).
- **Module 02:** Admin pages are `force-dynamic` so the auth guard always runs per request.
- **Module 03:** Only active properties with at least one active package appear to guests. "From EGP X" is the cheapest active package's base adult price (date-specific pricing applies at booking).
- **Module 03:** Search sorts/paginates in memory (price and rating sorts need aggregates Prisma can't order by). Revisit if the catalogue grows past a few hundred properties. Shared parsing lives in `lib/search.ts` (client-safe); the Prisma query in `lib/queries/properties.ts`.
- **Module 03:** Homepage is ISR (`revalidate = 60`); admin property/package edits call `revalidatePath('/')`.
- **Module 03:** Demo data: `npm run seed:demo` creates 8 fictional properties (slugs start with `demo-`); `npm run seed:demo -- --remove` deletes them. Hero/demo photos are Unsplash placeholders — replace before launch.
- **Module 03:** `/register`, `/privacy`, `/terms` are placeholders (Module 07 replaces `/register`).
- **Module 04:** All price maths lives in `lib/pricing.ts` (`resolvePrice` = override → day-of-week → base; `calculateQuote` = totals + 15% `PLATFORM_FEE_RATE` split, fee rounded to whole EGP). Client panel and server booking code must both use it.
- **Module 04:** Per-person add-ons are charged per paying guest (adults + children; infants only if the package doesn't make them free). Infants are charged the child price when `infantFree = false`.
- **Module 04:** Capacity counts adults on `confirmed`/`completed` bookings only (pending ones don't hold a spot). A property with no availability window shows "not taking bookings yet". "Today" is computed in Africa/Cairo time (`todayInEgypt()`).
- **Module 04:** Booking panel hands off to `/checkout?property=&package=&date=&adults=&children=&infants=&addOns=id1,id2` (readable params instead of an encoded `bookingData` blob). Module 05 must re-validate everything server-side.
- **Module 04:** Calendar is a custom component (native date inputs can't disable blackout dates). Booking horizon: 365 days. Week starts Saturday.
- **Module 04:** Child/infant age ranges are still an open item — the UI shows no ages yet.
- **Module 05:** Each booking has a secret `accessToken`; guest links are `/booking/[id]?t=<token>`. Owner (signed-in `userId`) and admins don't need it. Unknown and not-yours both return 404.
- **Module 05:** Booking money flow: `POST /api/bookings` re-prices everything server-side (`lib/booking-quote.ts`), creates a `pending` booking + PaymentIntent for the platform fee; the Stripe webhook confirms it. 100%-discount bookings (fee 0) are confirmed without Stripe. Coupon `usedCount` increments on confirmation, not at checkout.
- **Module 05:** Changes: the online fee difference is charged (new PaymentIntent, applied by the webhook) or refunded; the hotel's share difference is settled on arrival. Cancellation refunds every online payment on the booking. Cancellation policy (time threshold) is still an open item — currently any time before the visit day.
- **Module 05:** Phone numbers must be Egyptian mobiles, normalised to `+201XXXXXXXXX`. Revisit if foreign guests need to book.
- **Module 05:** Pending bookings that are never paid stay `pending` and don't hold capacity — Module 08 should add a cleanup or admin filter.
- **Module 06:** Every send attempt is logged in `NotificationLog` (with the error when it fails). Confirmation, reminder and review messages are sent at most once per channel; failed ones are retried by the next trigger. Missing keys never break a booking.
- **Module 06:** Extra event beyond the spec's four functions: `sendArrivalReminder` (day before the visit, includes the amount due at the hotel). WhatsApp templates to register in 360dialog: `booking_confirmed`, `booking_cancelled`, `booking_changed`, `review_request`, `arrival_reminder` (parameter order in `lib/whatsapp.ts`).
- **Module 06:** Daily crons in `app/vercel.json` (07:00 and 08:00 UTC): `/api/cron/arrival-reminders`, `/api/cron/review-requests`, protected by `CRON_SECRET`. Email previews for the team: Admin → Notifications → "Email previews".
- **Module 07:** Server auth uses `supabase.auth.getUser()` (validated), never `getSession()`. `requireAuth(returnTo)` in `lib/auth.ts`; middleware also redirects signed-out `/account/*` visits to `/login?next=…` (`?redirect=` accepted as an alias). `safeNextPath` blocks off-site redirects.
- **Module 07:** A `User` row is created lazily (`ensureUserRecord`) on first account visit / account API call, from Supabase `user_metadata`. Once the email is confirmed, earlier guest bookings with the same email are attached to the account.
- **Module 07:** Email links (sign-up confirmation, password reset) land on `/auth/callback`, which exchanges the code for a session. Added `/forgot-password` and `/account/reset-password`.
- **Module 07:** Reviews allowed for `confirmed` **or** `completed` bookings whose date has passed (Module 08 may mark visits completed). Pending (unpaid) bookings are hidden from guests. Profile password change re-checks the current password first.
- **Module 07 — Supabase settings to do:** (1) Authentication → URL Configuration: set Site URL to the app URL and add `http://localhost:3000/**` (and the production URL) to Redirect URLs. (2) Authentication → Emails → SMTP: plug in Resend (or another SMTP) — Supabase's built-in sender only delivers to project team members and is rate-limited, so real guests won't get confirmation/reset emails until this is done.
- **Module 08:** Dashboard KPIs use Cairo calendar days/months and the booking's `createdAt`; unpaid (`pending`) checkouts are excluded everywhere. Revenue = platform fees of confirmed/completed bookings. Chart = bookings made per day, last 30 days (single hue `#1F9C86`, validated ≥ 3:1 on white).
- **Module 08:** Admin cancel = same refund + notification path as guests, but also allowed after the visit date. Admins can "void" pending bookings: the Stripe PaymentIntent is cancelled so a late payment can't confirm it (no guest email). "Mark as completed" only on/after the visit day.
- **Module 08:** Bookings table filters live in the URL (shareable); CSV export uses the same filters, has a UTF-8 BOM for Excel, and neutralises formula injection (`=`, `+`, `-`, `@`).
- **Module 08:** Approving/rejecting a review revalidates the property page and homepage so ratings update immediately. Rejection notes are shown to the guest on My reviews.
- **Module 08:** Coupons are never deleted (bookings reference codes) — only deactivated. Codes are unique case-insensitively; percent 1–100, fixed ≤ EGP 100,000. "Expires on" date means valid through that day, Cairo time.
- **Module 08:** All admin timestamps are rendered in Cairo time (`formatCairoDateTime`), since Vercel servers run in UTC.
- **Module 09:** Mobile: search filters are a bottom sheet (Apply/Reset), checkout stepper shows numbers only < 640px, review stars are 44px targets, admin shows "Please use a desktop" < 768px except `/admin/bookings/[id]`. Verified no horizontal scroll at 390px on every page.
- **Module 09:** API errors are `{ error, code }` (`bad_request`, `unauthorized`, `forbidden`, `not_found`, `conflict`, `server_error`, `payment_provider_error`, `service_unavailable`). Success responses return the resource directly (not wrapped in `{ data }`) — changing every client for a wrapper wasn't worth the risk. A 401 from any client call redirects to `/login?error=session_expired&next=…`.
- **Module 09:** `loading.tsx` skeletons on search, account and admin. Deliberately **not** on `/property/[id]` and `/booking/[id]`: streaming a skeleton makes `notFound()` return HTTP 200 instead of 404 (bad for SEO; no data leaked, verified).
- **Module 09:** Guest-facing photos use `next/image` via `PropertyImage` (AVIF/WebP, `sizes`, `priority` above the fold) for Cloudinary/Unsplash; other hosts fall back to `<img>` so the optimiser can't be abused as an open proxy. Admin thumbnails stay plain `<img>`.
- **Module 09:** SEO: default metadata + OG in the root layout (`metadataBase` from `NEXT_PUBLIC_APP_URL`), property titles "`<name> — Day Use Booking | DayUse Egypt`" with canonical + OG image, filter-aware search titles, `sitemap.xml` (home, search, cities, bookable properties), `robots.txt`.
- **Module 09:** Prisma now has `directUrl` (`DIRECT_URL`) so Vercel can use the transaction pooler at runtime; `postinstall` runs `prisma generate`. Bundle check: largest client chunk 195 kB (< 250 kB); heaviest page is /checkout (232 kB first load, Stripe Elements).

---

## Launch checklist (status 2026-10-18)

- [x] All 9 modules complete and tested locally (automated API/DB suites + browser checks)
- [ ] At least 3 real properties entered in admin — only 8 fictional demo properties exist (`npm run seed:demo -- --remove` before launch)
- [ ] Stripe test payments end-to-end — needs Stripe test keys + webhook (code paths tested with signed fake events)
- [ ] Email notifications arriving — needs `RESEND_API_KEY`, verified domain, `EMAIL_FROM`, `ADMIN_NOTIFICATION_EMAIL`
- [ ] WhatsApp — needs 360dialog account + approved templates (currently logged as "not configured", never blocks bookings)
- [ ] Supabase Auth: redirect URLs + custom SMTP (see DEPLOY.md §6)
- [ ] Cloudinary keys for admin uploads (pasting image URLs works meanwhile)
- [ ] Deployed to Vercel + domain connected (DEPLOY.md)
- [ ] Mobile tested on a real device
- [ ] Open items above resolved (cancellation policy, child age ranges, branding, Stripe Egypt entity…)
- [ ] Rotate the Supabase database password (it was shared in a chat during setup)
