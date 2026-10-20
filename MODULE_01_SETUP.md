# MODULE 01 — Project Setup + Database

> **Read README.md first.** This file is for Claude Code session #1 only.

## Your Job

Set up the Next.js 14 project from scratch and create the complete database schema in Supabase via Prisma. By the end of this session the project should run locally with `npm run dev` and all tables should exist in Supabase.

---

## Step-by-Step

### 1. Scaffold Next.js

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
```

Install all dependencies:

```bash
npm install prisma @prisma/client @supabase/supabase-js @supabase/ssr \
  zustand react-hook-form @hookform/resolvers zod \
  date-fns embla-carousel-react \
  stripe @stripe/stripe-js @stripe/react-stripe-js \
  cloudinary resend \
  lucide-react clsx tailwind-merge
npm install -D @types/node
```

Install Playfair Display + Inter fonts via `next/font` (no npm needed).

### 2. Tailwind config

Replace `tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:    '#0D1B2A',
        coral:   '#E8634A',
        teal:    '#2BBFA4',
        sand:    '#E8D5B0',
        'grey-50':  '#F8F9FA',
        'grey-100': '#F0F2F4',
        'grey-300': '#C8CDD4',
        'grey-500': '#7A8694',
        'grey-700': '#3D4855',
      },
      fontFamily: {
        playfair: ['var(--font-playfair)', 'serif'],
        inter:    ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
```

### 3. Global CSS

`app/globals.css` — keep Tailwind directives, add:

```css
@layer base {
  body { @apply font-inter bg-white text-grey-700; }
  h1,h2,h3 { @apply font-playfair; }
}
```

### 4. Root layout with fonts

```tsx
// app/layout.tsx
import { Playfair_Display, Inter } from 'next/font/google'

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })
const inter    = Inter({ subsets: ['latin'], variable: '--font-inter' })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

### 5. Environment variables

Create `.env.local` (never commit):

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

RESEND_API_KEY=

WHATSAPP_API_KEY=
WHATSAPP_FROM_NUMBER=

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6. Prisma init

```bash
npx prisma init --datasource-provider postgresql
```

Set `DATABASE_URL` in `.env` to your Supabase connection string (Session mode, port 5432).

### 7. Prisma schema

Replace `prisma/schema.prisma` with the full schema below.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Property {
  id              String   @id @default(cuid())
  name            String
  slug            String   @unique
  city            String
  area            String?
  description     String
  type            String   // hotel | beach_club | resort
  stars           Int?
  address         String
  lat             Float?
  lng             Float?
  amenities       String[] // pool, beach, wifi, etc.
  images          String[] // Cloudinary URLs
  coverImage      String
  active          Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  packages        Package[]
  pricingRules    PropertyPricing[]
  availabilityWindows AvailabilityWindow[]
  blackoutDates   BlackoutDate[]
  bookings        Booking[]
  reviews         Review[]
}

model Package {
  id            String   @id @default(cuid())
  propertyId    String
  name          String   // e.g. "Pool Day", "Beach Access"
  description   String
  inclusions    String[] // ["Pool access", "Welcome drink", "Towel"]
  adultPrice    Float    // base price shown to guest (marked-up)
  childPrice    Float
  infantFree    Boolean  @default(true)
  maxAdults     Int?
  maxChildren   Int?
  active        Boolean  @default(true)
  sortOrder     Int      @default(0)

  property      Property @relation(fields: [propertyId], references: [id])
  addOns        PackageAddOn[]
  bookings      Booking[]
  pricingRules  PropertyPricing[]
}

model PackageAddOn {
  id          String  @id @default(cuid())
  packageId   String
  name        String
  price       Float
  perPerson   Boolean @default(true)
  active      Boolean @default(true)

  package     Package @relation(fields: [packageId], references: [id])
}

model PropertyPricing {
  id          String   @id @default(cuid())
  propertyId  String
  packageId   String?
  dayOfWeek   Int?     // 0=Sun … 6=Sat; null if dateOverride set
  dateOverride DateTime? @db.Date
  adultPrice  Float
  childPrice  Float

  property    Property @relation(fields: [propertyId], references: [id])
  package     Package? @relation(fields: [packageId], references: [id])

  @@unique([propertyId, packageId, dayOfWeek])
  @@unique([propertyId, packageId, dateOverride])
}

model AvailabilityWindow {
  id               String   @id @default(cuid())
  propertyId       String
  startTime        String   // "09:00"
  endTime          String   // "18:00"
  maxCapacityAdults Int
  maxCapacityChildren Int   @default(0)

  property         Property @relation(fields: [propertyId], references: [id])
}

model BlackoutDate {
  id         String   @id @default(cuid())
  propertyId String
  date       DateTime @db.Date
  reason     String?

  property   Property @relation(fields: [propertyId], references: [id])

  @@unique([propertyId, date])
}

model User {
  id          String   @id // matches Supabase Auth UID
  email       String   @unique
  name        String?
  phone       String?
  createdAt   DateTime @default(now())

  bookings    Booking[]
  reviews     Review[]
}

model Booking {
  id              String   @id @default(cuid())
  userId          String?
  guestName       String
  guestEmail      String
  guestPhone      String
  propertyId      String
  packageId       String
  bookingDate     DateTime @db.Date
  adults          Int
  children        Int      @default(0)
  infants         Int      @default(0)
  addOns          Json     @default("[]") // [{addOnId, qty, price}]
  totalPrice      Float    // what guest sees
  platformFee     Float    // charged by Stripe
  hotelAmount     Float    // collected on arrival
  couponCode      String?
  discountAmount  Float    @default(0)
  status          String   @default("pending") // pending|confirmed|cancelled|completed|changed
  stripePaymentId String?
  stripeRefundId  String?
  specialRequests String?
  internalNotes   String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user        User?    @relation(fields: [userId], references: [id])
  property    Property @relation(fields: [propertyId], references: [id])
  package     Package  @relation(fields: [packageId], references: [id])
  reviews     Review[]
  changeHistory BookingChange[]
}

model BookingChange {
  id            String   @id @default(cuid())
  bookingId     String
  changedAt     DateTime @default(now())
  oldDate       DateTime? @db.Date
  newDate       DateTime? @db.Date
  oldPackageId  String?
  newPackageId  String?
  priceDiff     Float    @default(0) // + means charged, - means refunded
  stripeChargeId String?
  stripeRefundId String?

  booking       Booking  @relation(fields: [bookingId], references: [id])
}

model Review {
  id          String   @id @default(cuid())
  bookingId   String
  userId      String
  propertyId  String
  rating      Int      // 1-5
  title       String?
  body        String
  status      String   @default("pending") // pending|approved|rejected
  adminNote   String?
  createdAt   DateTime @default(now())

  booking     Booking  @relation(fields: [bookingId], references: [id])
  user        User     @relation(fields: [userId], references: [id])
  property    Property @relation(fields: [propertyId], references: [id])
}

model Coupon {
  id            String   @id @default(cuid())
  code          String   @unique
  type          String   // percent | fixed
  value         Float
  minBookingTotal Float?
  maxUses       Int?
  usedCount     Int      @default(0)
  expiresAt     DateTime?
  active        Boolean  @default(true)
  createdAt     DateTime @default(now())
}

model NotificationLog {
  id          String   @id @default(cuid())
  bookingId   String?
  recipient   String   // email or phone
  channel     String   // email | whatsapp | sms
  type        String   // booking_confirmed | booking_cancelled | review_request | etc.
  status      String   @default("sent") // sent | failed
  sentAt      DateTime @default(now())
  error       String?
}
```

### 8. Run migration

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 9. Lib files

**`lib/prisma.ts`**
```ts
import { PrismaClient } from '@prisma/client'
declare global { var prisma: PrismaClient | undefined }
const prisma = global.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') global.prisma = prisma
export default prisma
```

**`lib/supabase.ts`**
```ts
import { createBrowserClient, createServerClient } from '@supabase/ssr'
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

**`lib/stripe.ts`**
```ts
import Stripe from 'stripe'
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})
```

**`lib/cloudinary.ts`**
```ts
import { v2 as cloudinary } from 'cloudinary'
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})
export default cloudinary
```

**`types/index.ts`**
```ts
export type PropertyType = 'hotel' | 'beach_club' | 'resort'
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'changed'
export type ReviewStatus  = 'pending' | 'approved' | 'rejected'
export type CouponType    = 'percent' | 'fixed'
export type NotificationChannel = 'email' | 'whatsapp' | 'sms'
```

### 10. Verify

```bash
npm run dev
```

Should start on http://localhost:3000 with no errors. Check Supabase dashboard — all tables should be visible.

---

## Update README.md

When done, change Module 01 status from ⬜ to ✅ in README.md.

## Hands the baton to

MODULE_02_ADMIN_PROPERTIES.md
