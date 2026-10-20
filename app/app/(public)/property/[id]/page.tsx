import { cache } from 'react'
import { notFound } from 'next/navigation'
import { Clock, MapPin, Star } from 'lucide-react'
import prisma from '@/lib/prisma'
import { getPriceRules } from '@/lib/availability'
import { getReviews, getReviewSummary } from '@/lib/queries/reviews'
import { toDateString, todayInEgypt, fromDateString } from '@/lib/utils'
import { PROPERTY_TYPE_LABELS } from '@/lib/validations/property'
import { BookingProvider, type BookingData } from '@/components/booking/BookingProvider'
import { BookingPanel } from '@/components/booking/BookingPanel'
import { MobileBookingBar } from '@/components/booking/MobileBookingBar'
import { PackageSelector } from '@/components/booking/PackageSelector'
import { AMENITY_ICONS } from '@/components/property/amenities'
import { PropertyGallery } from '@/components/property/PropertyGallery'
import { ReviewsSection } from '@/components/property/ReviewsSection'
import { Badge, type BadgeTone } from '@/components/ui/Badge'

// Cached for a minute; admin edits revalidate this page immediately.
export const revalidate = 60

const TYPE_TONES: Record<string, BadgeTone> = { hotel: 'solid-navy', beach_club: 'solid-teal', resort: 'solid-coral' }

const getProperty = cache((id: string) =>
  prisma.property.findFirst({
    where: { id, active: true },
    include: {
      packages: {
        where: { active: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: { addOns: { where: { active: true }, orderBy: { name: 'asc' } } },
      },
      availabilityWindows: { take: 1 },
      blackoutDates: { where: { date: { gte: fromDateString(todayInEgypt()) } }, orderBy: { date: 'asc' } },
    },
  }),
)

export async function generateMetadata({ params }: { params: { id: string } }) {
  const property = await getProperty(params.id)
  if (!property) return { title: 'Property not found — DayUse Egypt' }
  return {
    title: `${property.name} — Day Use Booking | DayUse Egypt`,
    description: property.description.slice(0, 160),
    openGraph: { title: `${property.name} — day pass`, description: property.description.slice(0, 160), images: [property.coverImage], url: `/property/${property.id}` },
    alternates: { canonical: `/property/${property.id}` },
  }
}

export default async function PropertyPage({ params }: { params: { id: string } }) {
  const property = await getProperty(params.id)
  // Inactive properties and ones with nothing to book aren't public.
  if (!property || property.packages.length === 0) notFound()

  const [rules, summary, firstReviews] = await Promise.all([getPriceRules(property.id), getReviewSummary(property.id), getReviews(property.id)])

  const window = property.availabilityWindows[0]
  const images = [property.coverImage, ...property.images.filter((src) => src !== property.coverImage)]
  const location = property.area ? `${property.area}, ${property.city}` : property.city
  const mapQuery = property.lat != null && property.lng != null ? `${property.lat},${property.lng}` : `${property.address}, ${property.city}, Egypt`

  const bookingData: BookingData = {
    propertyId: property.id,
    bookable: Boolean(window),
    blackoutDates: property.blackoutDates.map((b) => toDateString(b.date)),
    rules,
    packages: property.packages.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      inclusions: p.inclusions,
      adultPrice: p.adultPrice,
      childPrice: p.childPrice,
      infantFree: p.infantFree,
      maxAdults: p.maxAdults,
      maxChildren: p.maxChildren,
      addOns: p.addOns.map((a) => ({ id: a.id, name: a.name, price: a.price, perPerson: a.perPerson })),
    })),
  }

  return (
    <BookingProvider data={bookingData}>
      <PropertyGallery images={images} name={property.name} />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-28 pt-8 sm:px-6 lg:grid-cols-[minmax(0,65fr)_minmax(0,35fr)] lg:pb-16">
        <div className="min-w-0 space-y-12">
          <header>
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone={TYPE_TONES[property.type] ?? 'solid-navy'}>{PROPERTY_TYPE_LABELS[property.type as keyof typeof PROPERTY_TYPE_LABELS] ?? property.type}</Badge>
              {property.stars ? (
                <span className="flex gap-0.5" aria-label={`${property.stars}-star`}>
                  {Array.from({ length: property.stars }, (_, i) => (
                    <Star key={i} className="h-4 w-4 fill-sand text-sand" />
                  ))}
                </span>
              ) : null}
              {summary.average !== null && (
                <a href="#reviews" className="flex items-center gap-1 text-sm text-navy hover:underline">
                  <Star className="h-4 w-4 fill-coral text-coral" />
                  <strong>{summary.average.toFixed(1)}</strong>
                  <span className="text-grey-500">({summary.total})</span>
                </a>
              )}
            </div>
            <h1 className="mt-3 text-4xl leading-tight text-navy">{property.name}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-grey-500">
              <MapPin className="h-4 w-4" /> {location}
              {window && (
                <>
                  <span className="mx-2 text-grey-300">·</span>
                  <Clock className="h-4 w-4" /> {window.startTime}–{window.endTime}
                </>
              )}
            </p>

            {property.amenities.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2">
                {property.amenities.map((a) => {
                  const Icon = AMENITY_ICONS[a]
                  return (
                    <li key={a} className="flex items-center gap-2 rounded-full bg-grey-50 px-3 py-1.5 text-sm text-navy">
                      {Icon && <Icon className="h-4 w-4 text-teal" />} {a}
                    </li>
                  )
                })}
              </ul>
            )}
          </header>

          <section>
            <h2 className="text-2xl text-navy">About</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-grey-700">{property.description}</p>
          </section>

          <PackageSelector />

          <section>
            <h2 className="text-2xl text-navy">Location</h2>
            <p className="mt-2 text-sm text-grey-500">{property.address}</p>
            <iframe
              title={`Map of ${property.name}`}
              src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=14&output=embed`}
              className="mt-4 h-72 w-full rounded-xl border-0 bg-grey-100"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </section>

          <ReviewsSection propertyId={property.id} summary={summary} reviews={firstReviews.reviews} />
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <BookingPanel />
        </aside>
      </div>

      <MobileBookingBar />
    </BookingProvider>
  )
}
