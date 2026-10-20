# MODULE 09 — Polish, Mobile QA & Pre-Launch

> **Read README.md first.** All previous modules must be complete.

## Your Job

Final pass: mobile responsiveness, performance, error handling, edge cases, SEO basics, and Vercel deployment.

---

## Mobile Checklist

Go through every page on a 390px viewport (iPhone 14 size). Fix any issues:

### Homepage
- [ ] Hero search bar stacks vertically on mobile
- [ ] City chips scroll horizontally (no wrapping)
- [ ] Property grid is 1 column on mobile, 2 on tablet, 3 on desktop
- [ ] Navbar collapses to hamburger

### Search / Listing
- [ ] Filters move to a bottom drawer on mobile (slide up from bottom)
- [ ] Filter drawer has "Apply" and "Reset" buttons
- [ ] Results are 1 column on mobile

### Property Detail
- [ ] Gallery: single image with swipe (Embla handles this)
- [ ] Booking panel moves BELOW the property content on mobile
- [ ] Booking panel has a sticky "Book" button at the bottom of screen that scrolls to the panel

### Checkout
- [ ] Stepper shows step numbers only (no labels) on mobile
- [ ] Step 4 Stripe card element is full width

### Account
- [ ] Booking cards stack cleanly
- [ ] Review stars are tap-friendly (min 44px touch target)

### Admin
- [ ] Admin is DESKTOP ONLY — show a "Please use desktop" message on mobile < 768px
- [ ] Exception: bookings/[id] should be readable on mobile (admin may check on phone)

---

## Error Handling

Add error boundaries and proper error states throughout:

### API errors
All API routes should return consistent error format:
```ts
// Success: { data: ... }
// Error: { error: string, code?: string }
// Status codes: 400 bad input, 401 unauth, 403 forbidden, 404 not found, 409 conflict, 500 server
```

### UI error states
- Network error on booking: "Something went wrong. Your card has not been charged."
- Availability gone: "Sorry, this date just became unavailable. Please choose another date."
- Payment declined: show Stripe error message
- Session expired: redirect to login with message

### Loading states
- All data fetches should have skeleton loaders (use `Suspense` + `loading.tsx` where possible)
- Booking panel: disable "Book Now" while checking availability

---

## Edge Cases to Test

- [ ] Book a property on a blackout date (should be blocked)
- [ ] Book when capacity = 0 (should be blocked)
- [ ] Apply an expired coupon (should fail with clear message)
- [ ] Apply a coupon with max uses reached (should fail)
- [ ] Submit a review without a confirmed booking (should be blocked server-side)
- [ ] Try to access /admin without admin role (should redirect)
- [ ] Try to access another user's booking in /account (should 404)
- [ ] Stripe webhook with invalid signature (should 400)
- [ ] Cancel a booking that's already cancelled (should 409)

---

## SEO Basics

### Metadata
```ts
// app/(public)/property/[id]/page.tsx
export async function generateMetadata({ params }) {
  const property = await getProperty(params.id)
  return {
    title: `${property.name} — Day Use Booking | DayUse Egypt`,
    description: property.description.slice(0, 160),
    openGraph: {
      images: [property.coverImage],
    }
  }
}
```

Do this for:
- Homepage
- Property detail pages
- Search page (dynamic based on city/filters)

### sitemap.xml
```ts
// app/sitemap.ts
export default async function sitemap() {
  const properties = await prisma.property.findMany({ where: { active: true } })
  return [
    { url: 'https://yourdomain.com', lastModified: new Date() },
    { url: 'https://yourdomain.com/search', lastModified: new Date() },
    ...properties.map(p => ({
      url: `https://yourdomain.com/property/${p.id}`,
      lastModified: p.updatedAt,
    }))
  ]
}
```

### robots.txt
```ts
// app/robots.ts
export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin/', '/account/', '/api/'] },
    sitemap: 'https://yourdomain.com/sitemap.xml',
  }
}
```

---

## Performance

- [ ] All property images use `next/image` with correct `sizes` prop
- [ ] Cover images use `priority` prop on listing pages
- [ ] Add `loading="lazy"` to below-fold images
- [ ] Review that no large client bundles are in server components
- [ ] Check bundle size: `next build` should report no chunks > 250kb

---

## Vercel Deployment

1. Push to GitHub
2. Import project in Vercel
3. Add all env variables from `.env.local`
4. Set `DATABASE_URL` to Supabase **Transaction** pooler (port 6543) for Vercel serverless
5. Add Stripe webhook endpoint: `https://yourdomain.vercel.app/api/webhooks/stripe`
6. Add `STRIPE_WEBHOOK_SECRET` from Stripe dashboard
7. Add Vercel Cron: confirm `vercel.json` has the cron config from Module 06
8. Set `NEXT_PUBLIC_APP_URL` to your Vercel URL

### Supabase connection for Vercel
Use the **Session mode** pooler (port 5432) for Prisma migrations.
Use the **Transaction mode** pooler (port 6543) for runtime queries in serverless.

```
# .env (for migrations)
DATABASE_URL=postgresql://...@db.xxx.supabase.co:5432/postgres

# Add to Vercel env (for runtime)
DATABASE_URL=postgresql://...@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true
```

---

## Final Checklist Before Launch

- [ ] All 9 modules complete
- [ ] At least 3 real properties entered in admin
- [ ] Stripe test payments working end-to-end
- [ ] Email notifications arriving (Resend)
- [ ] WhatsApp notifications tested (or gracefully skipped if not ready)
- [ ] Mobile tested on real device
- [ ] Admin can approve/reject reviews
- [ ] Coupon codes work
- [ ] Domain connected in Vercel
- [ ] All open items in README.md resolved

---

## Update README.md

When done:
- Change Module 09 status from ⬜ to ✅
- Update "Last updated" date
- Add any new decisions made during QA

🎉 **Ship it.**
