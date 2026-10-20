import { NextResponse, type NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { handleApiError, jsonError, requireAdmin, revalidatePublicPages } from '@/lib/api'
import { PackageSchema } from '@/lib/validations/property'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const { addOns, ...data } = PackageSchema.parse(await request.json())
    const property = await prisma.property.findUnique({ where: { id: params.id }, select: { id: true } })
    if (!property) return jsonError('Property not found', 404)

    const pkg = await prisma.package.create({
      data: {
        ...data,
        propertyId: params.id,
        addOns: { create: addOns.map(({ name, price, perPerson, active }) => ({ name, price, perPerson, active })) },
      },
      include: { addOns: true },
    })
    revalidatePublicPages(params.id)
    return NextResponse.json(pkg, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
