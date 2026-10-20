import { NextResponse, type NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { handleApiError, jsonError, requireAdmin, revalidatePublicPages } from '@/lib/api'
import { PropertyUpdateSchema } from '@/lib/validations/property'

type Ctx = { params: { id: string } }

export async function GET(_request: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin()
  if (denied) return denied

  const property = await prisma.property.findUnique({
    where: { id: params.id },
    include: {
      packages: { orderBy: { sortOrder: 'asc' }, include: { addOns: true } },
      pricingRules: true,
      availabilityWindows: true,
      blackoutDates: { orderBy: { date: 'asc' } },
    },
  })
  if (!property) return jsonError('Property not found', 404)
  return NextResponse.json(property)
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const data = PropertyUpdateSchema.parse(await request.json())
    const property = await prisma.property.update({ where: { id: params.id }, data })
    revalidatePublicPages(params.id)
    return NextResponse.json(property)
  } catch (err) {
    return handleApiError(err)
  }
}

// Soft delete: bookings and reviews keep pointing at the property.
export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const property = await prisma.property.update({ where: { id: params.id }, data: { active: false } })
    revalidatePublicPages(params.id)
    return NextResponse.json(property)
  } catch (err) {
    return handleApiError(err)
  }
}
