import Link from 'next/link'
import prisma from '@/lib/prisma'
import { BookingError, priceBooking } from '@/lib/booking-quote'
import { BookingSelectionSchema } from '@/lib/validations/booking'
import { CheckoutFlow, type CheckoutData } from '@/components/checkout/CheckoutFlow'
import { buttonClasses } from '@/components/ui/Button'

export const metadata = { title: 'Checkout — DayUse Egypt', robots: { index: false } }
export const dynamic = 'force-dynamic'

type Params = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''

// Entry point from the property page: /checkout?property=&package=&date=&adults=&children=&infants=&addOns=
export default async function CheckoutPage({ searchParams }: { searchParams: Params }) {
  const parsed = BookingSelectionSchema.safeParse({
    propertyId: one(searchParams.property),
    packageId: one(searchParams.package),
    date: one(searchParams.date),
    adults: Number(one(searchParams.adults) || 1),
    children: Number(one(searchParams.children) || 0),
    infants: Number(one(searchParams.infants) || 0),
    addOnIds: one(searchParams.addOns).split(',').filter(Boolean),
  })
  if (!parsed.success) return <Problem message="That booking link is incomplete. Please choose your day again." />

  const selection = parsed.data
  let priced
  try {
    priced = await priceBooking(selection)
  } catch (err) {
    if (err instanceof BookingError) return <Problem message={err.message} propertyId={selection.propertyId} />
    throw err
  }

  const property = await prisma.property.findUniqueOrThrow({
    where: { id: selection.propertyId },
    select: { coverImage: true, city: true, area: true, availabilityWindows: { take: 1, select: { startTime: true, endTime: true } } },
  })
  const window = property.availabilityWindows[0]

  const data: CheckoutData = {
    selectionKey: JSON.stringify(selection),
    selection,
    property: {
      id: priced.property.id,
      name: priced.property.name,
      coverImage: property.coverImage,
      location: property.area ? `${property.area}, ${property.city}` : property.city,
      hours: window ? `${window.startTime}–${window.endTime}` : null,
    },
    packageName: priced.pkg.name,
    infantFree: priced.pkg.infantFree,
    price: { adultPrice: priced.price.adultPrice, childPrice: priced.price.childPrice },
    addOns: priced.addOnLines.map(({ addOnId, name, price, perPerson }) => ({ addOnId, name, price, perPerson })),
  }
  return <CheckoutFlow data={data} />
}

function Problem({ message, propertyId }: { message: string; propertyId?: string }) {
  return (
    <section className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl text-navy">We can&apos;t continue with this booking</h1>
      <p className="mt-3 text-grey-500">{message}</p>
      <Link href={propertyId ? `/property/${propertyId}` : '/search'} className={buttonClasses('primary', 'md', 'mt-8')}>
        {propertyId ? 'Back to the property' : 'Explore day passes'}
      </Link>
    </section>
  )
}
