# MODULE 03 — Guest: Discovery & Listing

> **Read README.md first.** Modules 01–02 must be complete.

## Your Job

Build the public-facing homepage and search/listing page. Guests can browse properties by city, filter by type and amenities, and see search results as cards.

---

## Routes to Build

| Route | Purpose |
|---|---|
| `/` | Homepage: hero, city chips, featured properties |
| `/search` | Listing results with filters |

---

## Homepage (`app/(public)/page.tsx`)

### Hero Section
- Full-bleed background image (beach/pool photo)
- Headline (Playfair Display, large): "Your perfect day escape"
- Subheadline: "Hotels · Beach Clubs · Resorts in Egypt"
- Search bar: City dropdown + Date picker → "Search" button (coral)
- Overlay: dark gradient so text is readable

### City Strip
Horizontal scrollable chips: Hurghada · Ain Sokhna · Sharm el Sheikh · Cairo · Alexandria
Click → goes to `/search?city=hurghada`

### Featured Properties
Grid of `PropertyCard` components. Pull `active` properties from DB (server component, Prisma). Show 6 on homepage.

---

## Search Page (`app/(public)/search/page.tsx`)

### URL params
`?city=hurghada&date=2025-08-15&type=beach_club&amenities=pool,beach`

### Layout
- Left: filters sidebar (desktop) / drawer (mobile)
- Right: results grid

### Filters
- City (select)
- Date (date picker — used later for capacity check)
- Type: All / Hotel / Beach Club / Resort (radio)
- Amenities (checkboxes: Pool, Private Beach, WiFi, Restaurant, Spa)
- Stars (1–5 stars checkboxes)
- Sort: Recommended / Price Low→High / Price High→Low / Top Rated

### Results
`PropertyCard` grid. Show count: "12 properties found". Empty state with illustration if 0 results.

Pagination: simple prev/next or load more (load more preferred).

---

## Component: `components/property/PropertyCard.tsx`

```tsx
// Props: property (with cheapest package price)
// Layout:
// - Full-bleed cover image (aspect-[4/3])
// - Bottom overlay with: name, city, type badge, star rating
// - Below image: cheapest package price "From EGP X / person", amenity icons (3 max)
// - On hover: subtle scale + shadow
// - Link: /property/[id]
```

Design: white card, 8px radius, shadow-md on hover. Badge colors: hotel=navy, beach_club=teal, resort=coral.

---

## Component: `components/property/PropertyFilters.tsx`

Filter state lives in URL params (use `useSearchParams` + `useRouter`). No separate state library needed here.

---

## API Route: `GET /api/properties`

Query params: `city`, `type`, `amenities` (comma-separated), `date`, `sort`, `page`, `limit`

```ts
// Build Prisma where clause from params
// Include cheapest package price
// If date provided: check blackout_dates (exclude properties with blackout on that date)
// Capacity check is done at booking time, not listing time
// Return: { properties, total, page, limit }
```

---

## Server Component Data Fetching

Use React Server Components for initial data. For filters (client-driven), use client components that call `/api/properties`.

Pattern:
```tsx
// app/(public)/search/page.tsx — server component
// Reads searchParams → calls Prisma directly (no fetch needed server-side)
// Passes data to client components
```

---

## `components/ui/` Base Components to Build

These are needed here and reused everywhere:

| Component | Description |
|---|---|
| `Button` | variant: primary/secondary/ghost, size: sm/md/lg |
| `Input` | text input with label, error state |
| `Select` | styled select with label |
| `Badge` | small colored label |
| `Skeleton` | loading placeholder |
| `DatePicker` | wraps a simple `<input type="date">` with custom styling |
| `Spinner` | loading spinner |

Use `clsx` + `tailwind-merge` for conditional classes.

---

## Navbar (`components/layout/Navbar.tsx`)

- Logo left (text "DayUse" in Playfair, navy or white depending on page)
- Links: Explore / How it works
- Right: Sign in / Sign up buttons, or avatar if logged in
- Sticky, blur backdrop on scroll
- Mobile: hamburger menu

---

## Footer (`components/layout/Footer.tsx`)

Simple: logo, city links, legal links (Privacy, Terms), copyright.

---

## Update README.md

When done, change Module 03 status from ⬜ to ✅.

## Hands the baton to

MODULE_04_PROPERTY_DETAIL.md
