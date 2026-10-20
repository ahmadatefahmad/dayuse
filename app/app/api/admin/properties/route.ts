import { NextResponse, type NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { handleApiError, requireAdmin, revalidatePublicPages } from '@/lib/api'
import { PropertySchema } from '@/lib/validations/property'

export async function GET() {
  const denied = await requireAdmin()
  if (denied) return denied

  const properties = await prisma.property.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      type: true,
      coverImage: true,
      active: true,
      updatedAt: true,
      _count: { select: { packages: true } },
    },
  })
  return NextResponse.json(properties)
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const data = PropertySchema.parse(await request.json())
    const property = await prisma.property.create({ data })
    revalidatePublicPages()
    return NextResponse.json(property, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
