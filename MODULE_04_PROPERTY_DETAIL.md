# MODULE 04 — Guest: Property Detail Page

> **Read README.md first.** Modules 01–03 must be complete.

## Your Job

Build the property detail page — the most important guest-facing page. Guests see the gallery, property info, reviews, and a sticky booking panel where they choose a package, date, and guest count.

---

## Route

`/property/[id]` — server component + client booking panel

---

## Page Layout (desktop)

```
[Full-bleed Gallery — spans full width, 60vh]
[Below gallery: 2-column layout]
  Left (65%): Property info, packages, amenities, reviews
  Right (35%, sticky top): Booking panel
[Mobile: booking panel below content, full-width]
```

---

## Gallery (`components/property/PropertyGallery.tsx`)

- Embla Carousel for the main image
- Thumbnail strip below (or dot navigation on mobile)
- "View all photos" button → opens lightbox modal (build a simple modal with all images in a grid)
- Cover image always first

---

## Property Info Section

```
- Name (Playfair, 36px)
- Type badge + Stars (if hotel)
- City + Area
- Row of amenity icons + labels (Pool, Beach, WiFi, etc.)
- "About" section: full description
- Map placeholder (show static Google Maps embed or just address for now)
```

---

## Package Selector (`components/booking/PackageSelector.tsx`)

Shows all active packages for the property. Each package card:

```
[Package name]              [SELECT button — coral outline → filled when selected]
[Description]
[Inclusions as checkmarks]
Adult: EGP ___   Child: EGP ___   Infants: Free
[Add-ons section — expandable]
```

Add-ons: checkboxes per add-on. `perPerson=true` means × guest count.

Price shown is date-sensitive (see pricing rules in README).

---

## Booking Panel (`components/booking/BookingPanel.tsx`)

Sticky right panel. Client component.

```
[Date picker]                     ← check blackout dates (call API)
[Package selector (compact)]
[Guest count: Adults − + | Children − + | Infants − +]
[Add-ons checkboxes]
[Price breakdown:
  Package × guests:  EGP ___
  Add-ons:           EGP ___
  ─────────────────────────
  Total:             EGP ___
  Pay online (booking fee):  EGP ___
  Pay on arrival:    EGP ___
]
[BOOK NOW button → /checkout?bookingData=...]
```

**Critical rule:** Always show the pay online / pay on arrival split. The guest must never be surprised at the hotel.

Platform fee = 15% of total (configure as constant). Hotel amount = total − platform fee.

---

## Availability Check

`GET /api/properties/[id]/availability?date=2025-08-15`

Returns:
```ts
{
  available: boolean,
  isBlackout: boolean,
  spotsLeft: number | null,
}
```

Logic:
1. Check `blackout_dates` for this property + date → if found: `{ available: false, isBlackout: true }`
2. Count `bookings` where `propertyId = id` AND `bookingDate = date` AND `status IN (confirmed, completed)`, sum adults
3. Compare to `availabilityWindows.maxCapacityAdults`
4. Return spots left

---

## Pricing Lookup

`GET /api/properties/[id]/pricing?date=2025-08-15&packageId=xxx`

Logic (implement in `lib/availability.ts`):
```ts
// 1. Check PropertyPricing where propertyId + packageId + dateOverride = date → use if found
// 2. Else check PropertyPricing where propertyId + packageId + dayOfWeek = date.getDay()
// 3. Else fall back to Package.adultPrice / Package.childPrice
// Return { adultPrice, childPrice }
```

---

## Reviews Section

Below the main content:

```
[Average rating — large number + stars + "X reviews"]
[Rating breakdown: 5★ ████ 60%, 4★ ███ 30%, ...]
[Review cards: avatar initials, name, date, rating, title, body]
[Show 5, "Load more" button]
```

Only show `status = approved` reviews.

`GET /api/properties/[id]/reviews?page=1&limit=5`

---

## "Write a Review" CTA

Show below reviews only if:
- User is logged in
- User has a `confirmed` booking for this property with `bookingDate < today`
- User has not already reviewed this booking

Link → `/account/reviews/new?bookingId=xxx`

---

## Update README.md

When done, change Module 04 status from ⬜ to ✅.

## Hands the baton to

MODULE_05_CHECKOUT.md
