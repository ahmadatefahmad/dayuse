import prisma from '@/lib/prisma'
import { PackagesManager, type PackageItem } from '@/components/admin/PackagesManager'

export default async function PackagesPage({ params }: { params: { id: string } }) {
  const packages = await prisma.package.findMany({
    where: { propertyId: params.id },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { addOns: { orderBy: { name: 'asc' } } },
  })

  const items: PackageItem[] = packages.map((p) => ({
    id: p.id,
    values: {
      name: p.name,
      description: p.description,
      inclusions: p.inclusions,
      adultPrice: p.adultPrice,
      childPrice: p.childPrice,
      infantFree: p.infantFree,
      maxAdults: p.maxAdults,
      maxChildren: p.maxChildren,
      active: p.active,
      sortOrder: p.sortOrder,
      addOns: p.addOns.map((a) => ({ id: a.id, name: a.name, price: a.price, perPerson: a.perPerson, active: a.active })),
    },
  }))

  return <PackagesManager propertyId={params.id} items={items} />
}
