# MODULE 02 — Admin: Property Management

> **Read README.md first.** Module 01 must be complete (schema migrated, project runs).

## Your Job

Build the internal admin dashboard for managing properties. Admins can create, edit, and publish properties with full details: images (Cloudinary), packages, add-ons, pricing rules, availability windows, and blackout dates.

Admin is role-gated: only users with `admin` role in Supabase can access `/admin/*`.

---

## Routes to Build

| Route | Purpose |
|---|---|
| `/admin` | Redirect to `/admin/dashboard` |
| `/admin/dashboard` | KPI summary (placeholder for now) |
| `/admin/properties` | Table of all properties |
| `/admin/properties/new` | Create property |
| `/admin/properties/[id]` | Edit property |
| `/admin/properties/[id]/packages` | Manage packages + add-ons |
| `/admin/properties/[id]/pricing` | Pricing rules per package |
| `/admin/properties/[id]/availability` | Capacity + blackout dates |

---

## Layout

`app/(admin)/layout.tsx` — sidebar + topbar, dark navy theme.

```tsx
// Sidebar links:
// Dashboard, Properties, Bookings, Reviews, Coupons, Notifications
// Logo top-left, sign-out bottom

// Guard: check Supabase session server-side; if no session or not admin role → redirect /login
```

Sidebar color: `bg-navy text-white`. Active link: `bg-coral/20 text-coral border-l-2 border-coral`.

---

## Components to Build

### `components/admin/AdminSidebar.tsx`
Nav links with icons (lucide-react). Highlight active route.

### `components/admin/AdminTable.tsx`
Reusable table: accepts `columns` (key + header + optional render fn) and `data`. Sortable headers. Empty state. Loading skeleton.

### `components/admin/KpiCard.tsx`
Card with title, value, delta, icon. Used on dashboard.

### `components/admin/ImageUploader.tsx`
Multi-image upload to Cloudinary via `/api/upload` route. Shows preview grid. Drag to reorder. Delete button per image. Returns array of URLs to parent form.

---

## API Routes

### `POST /api/upload`
Receives `multipart/form-data` with image files. Uploads each to Cloudinary under folder `dayuse/properties`. Returns `{ urls: string[] }`.

```ts
// Use cloudinary.uploader.upload(buffer, { folder: 'dayuse/properties' })
```

### `GET /api/admin/properties`
Return all properties with package count. Admin only.

### `POST /api/admin/properties`
Create property. Validate with Zod. Return created property.

### `GET /api/admin/properties/[id]`
Return property with packages, pricing, availability, blackout dates.

### `PATCH /api/admin/properties/[id]`
Update property fields.

### `DELETE /api/admin/properties/[id]`
Soft delete: set `active = false`.

### `POST /api/admin/properties/[id]/packages`
Create package with add-ons.

### `PATCH /api/admin/properties/[id]/packages/[pkgId]`
Update package.

### `POST /api/admin/properties/[id]/pricing`
Upsert pricing rules (day_of_week or date_override per package).

### `POST /api/admin/properties/[id]/availability`
Save availability window + blackout dates.

---

## Property Form Fields

```
Basic Info:
- name (text)
- slug (auto-generated from name, editable)
- type (select: hotel | beach_club | resort)
- city (select: Hurghada | Cairo | Sharm el Sheikh | Alexandria | Ain Sokhna)
- area (text, optional)
- stars (1-5, optional)
- address (text)
- description (textarea)
- amenities (multi-select checkboxes: Pool, Private Beach, WiFi, Restaurant, Spa, Gym, Kids Area, Parking)
- active (toggle)

Images:
- coverImage (single upload, required)
- images (multi-upload, up to 12)
```

---

## Package Form

Each property has N packages. For each:
```
- name
- description
- inclusions (tag input — press Enter to add)
- adultPrice (number)
- childPrice (number)
- infantFree (checkbox, default true)
- maxAdults (number, optional)
- active (toggle)
- sortOrder (number)

Add-ons (nested list):
  - name
  - price
  - perPerson (checkbox)
  - active
```

---

## Pricing Rules

For each package, set prices per day of week:

| Day | Adult Price | Child Price |
|---|---|---|
| Monday | EGP ___ | EGP ___ |
| ... | | |
| Friday (weekend) | EGP ___ | EGP ___ |

Plus date overrides (pick date → set adult + child price). Override takes priority over day-of-week.

---

## Availability

- `startTime` / `endTime` (time inputs, e.g. 09:00 – 18:00)
- `maxCapacityAdults` (number)
- `maxCapacityChildren` (number)
- Blackout dates: date picker → add to list. List shows date + optional reason. Delete button.

---

## Zod Schemas (put in `lib/validations/property.ts`)

```ts
import { z } from 'zod'

export const PropertySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  type: z.enum(['hotel', 'beach_club', 'resort']),
  city: z.string().min(1),
  area: z.string().optional(),
  stars: z.number().int().min(1).max(5).optional(),
  address: z.string().min(5),
  description: z.string().min(20),
  amenities: z.array(z.string()),
  images: z.array(z.string().url()),
  coverImage: z.string().url(),
  active: z.boolean().default(true),
})

export const PackageSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  inclusions: z.array(z.string()),
  adultPrice: z.number().positive(),
  childPrice: z.number().nonnegative(),
  infantFree: z.boolean().default(true),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  addOns: z.array(z.object({
    name: z.string(),
    price: z.number().nonnegative(),
    perPerson: z.boolean().default(true),
    active: z.boolean().default(true),
  })),
})
```

---

## Admin Auth Guard

In `app/(admin)/layout.tsx`:

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// Check session
// Check user_metadata.role === 'admin'  (set this in Supabase Auth manually for now)
// If not: redirect('/login')
```

To make yourself admin in Supabase:
1. Go to Authentication → Users
2. Find your user → Edit → Set `raw_user_meta_data` to `{"role":"admin"}`

---

## Update README.md

When done, change Module 02 status from ⬜ to ✅.

## Hands the baton to

MODULE_03_GUEST_LISTING.md
