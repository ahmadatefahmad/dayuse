import { NextResponse, type NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { handleApiError, jsonError, requireAdmin, revalidatePublicPages } from '@/lib/api'
import { fromDateString } from '@/lib/utils'
import { AvailabilitySchema } from '@/lib/validations/property'

// Saves the property's single availability window and replaces its blackout dates.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const { blackoutDates, ...window } = AvailabilitySchema.parse(await request.json())
    const property = await prisma.property.findUnique({ where: { id: params.id }, select: { id: true } })
    if (!property) return jsonError('Property not found', 404)

    await prisma.$transaction([
      prisma.availabilityWindow.deleteMany({ where: { propertyId: params.id } }),
      prisma.availabilityWindow.create({ data: { ...window, propertyId: params.id } }),
      prisma.blackoutDate.deleteMany({ where: { propertyId: params.id } }),
      prisma.blackoutDate.createMany({
        data: blackoutDates.map((b) => ({ propertyId: params.id, date: fromDateString(b.date), reason: b.reason || null })),
      }),
    ])
    revalidatePublicPages(params.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}
