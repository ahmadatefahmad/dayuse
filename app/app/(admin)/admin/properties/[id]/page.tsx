import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { PropertyForm } from '@/components/admin/PropertyForm'
import { DeactivateButton } from '@/components/admin/DeactivateButton'
import type { PropertyInput } from '@/lib/validations/property'

export default async function EditPropertyPage({ params }: { params: { id: string } }) {
  const p = await prisma.property.findUnique({ where: { id: params.id } })
  if (!p) notFound()

  const initial: PropertyInput = {
    name: p.name,
    slug: p.slug,
    type: p.type as PropertyInput['type'],
    city: p.city,
    area: p.area,
    stars: p.stars,
    address: p.address,
    description: p.description,
    amenities: p.amenities,
    images: p.images,
    coverImage: p.coverImage,
    active: p.active,
  }

  return (
    <div className="space-y-6">
      {/* key forces the form to re-initialise after a deactivate refreshes the data */}
      <PropertyForm key={String(p.updatedAt.getTime())} propertyId={p.id} initial={initial} />
      {p.active && <DeactivateButton propertyId={p.id} />}
    </div>
  )
}
