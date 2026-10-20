import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import prisma from '@/lib/prisma'
import { PropertyTabs } from '@/components/admin/PropertyTabs'
import { Badge } from '@/components/ui/Badge'

export default async function PropertyLayout({ children, params }: { children: React.ReactNode; params: { id: string } }) {
  const property = await prisma.property.findUnique({ where: { id: params.id }, select: { name: true, city: true, active: true } })
  if (!property) notFound()

  return (
    <>
      <Link href="/admin/properties" className="mb-4 inline-flex items-center gap-1 text-sm text-grey-500 hover:text-navy">
        <ArrowLeft className="h-4 w-4" /> All properties
      </Link>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl text-navy">{property.name}</h1>
        {property.active ? <Badge tone="teal">Active</Badge> : <Badge>Inactive</Badge>}
      </div>
      <PropertyTabs propertyId={params.id} />
      {children}
    </>
  )
}
