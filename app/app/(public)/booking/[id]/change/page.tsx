import Link from 'next/link'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getPriceRules } from '@/lib/availability'
import { canAccessBooking } from '@/lib/booking-access'
import { bookingReference } from '@/lib/booking-format'
import { addOnIdsOf } from '@/lib/bookings'
import { fromDateString, toDateString, todayInEgypt } from '@/lib/utils'
import { ChangeForm } from '@/components/booking/ChangeForm'
import { buttonClasses } from '@/components/ui/Button'

export const metadata = { title: 'Change booking — DayUse Egypt', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function ChangeBookingPage({ params, searchParams }: { params: { id: string }; searchParams: { t?: string } }) {
  const booking = await prisma.booking.findUnique({ where: { id: params.id }, include: { property: { select: { name: true } } } })
  if (!booking || !(await canAccessBooking(booking, searchParams.t))) notFound()

  const token = searchParams.t ?? null
  const date = toDateString(booking.bookingDate)
  const back = `/booking/${booking.id}${token ? `?t=${encodeURIComponent(token)}` : ''}`

  // Changes are only possible for confirmed bookings before the day of the visit.
  if (booking.status !== 'confirmed' || date <= todayInEgypt()) {
    return (
      <section className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl text-navy">This booking can&apos;t be changed</h1>
        <p className="mt-3 text-grey-500">Only confirmed bookings can be changed, up to the day before your visit.</p>
        <Link href={back} className={buttonClasses('primary', 'md', 'mt-8')}>
          Back to your booking
        </Link>
      </section>
    )
  }

  const [packages, rules, blackouts] = await Promise.all([
    prisma.package.findMany({
      where: { propertyId: booking.propertyId, active: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, adultPrice: true, childPrice: true, infantFree: true, addOns: { where: { active: true }, select: { id: true, price: true, perPerson: true } } },
    }),
    getPriceRules(booking.propertyId),
    prisma.blackoutDate.findMany({ where: { propertyId: booking.propertyId, date: { gte: fromDateString(todayInEgypt()) } }, select: { date: true } }),
  ])
  // The current package may have been deactivated since booking; keep it selectable for the guest.
  if (!packages.some((p) => p.id === booking.packageId)) {
    const current = await prisma.package.findUnique({
      where: { id: booking.packageId },
      select: { id: true, name: true, adultPrice: true, childPrice: true, infantFree: true, addOns: { select: { id: true, price: true, perPerson: true } } },
    })
    if (current) packages.unshift(current)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link href={back} className="text-sm text-grey-500 hover:text-navy">
        ← Back to booking {bookingReference(booking.id)}
      </Link>
      <h1 className="mt-3 text-3xl text-navy sm:text-4xl">Change your day at {booking.property.name}</h1>
      <p className="mb-8 mt-2 text-grey-500">Changes are free — you only pay or get back the difference in the online booking fee.</p>
      <ChangeForm
        booking={{
          id: booking.id,
          token,
          date,
          packageId: booking.packageId,
          adults: booking.adults,
          children: booking.children,
          infants: booking.infants,
          addOnIds: addOnIdsOf(booking.addOns),
          discountAmount: booking.discountAmount,
          totalPrice: booking.totalPrice,
          platformFee: booking.platformFee,
          hotelAmount: booking.hotelAmount,
        }}
        packages={packages}
        rules={rules}
        blackoutDates={blackouts.map((b) => toDateString(b.date))}
      />
    </div>
  )
}
