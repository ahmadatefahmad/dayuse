import Link from 'next/link'
import prisma from '@/lib/prisma'
import { PricingManager } from '@/components/admin/PricingManager'
import { buttonClasses } from '@/components/ui/Button'
import { toDateString } from '@/lib/utils'

export default async function PricingPage({ params }: { params: { id: string } }) {
  const [packages, rules] = await Promise.all([
    prisma.package.findMany({
      where: { propertyId: params.id },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, adultPrice: true, childPrice: true, active: true },
    }),
    prisma.propertyPricing.findMany({ where: { propertyId: params.id } }),
  ])

  if (packages.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-grey-300 bg-white p-12 text-center text-sm text-grey-500">
        <p>Pricing is set per package. Add a package first.</p>
        <Link href={`/admin/properties/${params.id}/packages`} className={buttonClasses('primary', 'sm', 'mt-4')}>
          Go to packages
        </Link>
      </div>
    )
  }

  return (
    <PricingManager
      propertyId={params.id}
      packages={packages}
      rules={rules.map((r) => ({
        packageId: r.packageId,
        dayOfWeek: r.dayOfWeek,
        date: r.dateOverride ? toDateString(r.dateOverride) : null,
        adultPrice: r.adultPrice,
        childPrice: r.childPrice,
      }))}
    />
  )
}
