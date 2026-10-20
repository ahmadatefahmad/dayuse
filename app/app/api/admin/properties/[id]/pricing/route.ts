import { NextResponse, type NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { handleApiError, jsonError, requireAdmin, revalidatePublicPages } from '@/lib/api'
import { fromDateString } from '@/lib/utils'
import { PricingSchema } from '@/lib/validations/property'

// Replaces every pricing rule for one package. Prisma can't upsert on a compound unique
// containing nullable columns, so delete + recreate in a transaction is the reliable "upsert".
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const { packageId, days, overrides } = PricingSchema.parse(await request.json())
    const pkg = await prisma.package.findFirst({ where: { id: packageId, propertyId: params.id }, select: { id: true } })
    if (!pkg) return jsonError('Package not found for this property', 404)

    const rows = [
      ...days.map((d) => ({ propertyId: params.id, packageId, dayOfWeek: d.dayOfWeek, adultPrice: d.adultPrice, childPrice: d.childPrice })),
      ...overrides.map((o) => ({ propertyId: params.id, packageId, dateOverride: fromDateString(o.date), adultPrice: o.adultPrice, childPrice: o.childPrice })),
    ]
    await prisma.$transaction([
      prisma.propertyPricing.deleteMany({ where: { propertyId: params.id, packageId } }),
      prisma.propertyPricing.createMany({ data: rows }),
    ])
    revalidatePublicPages(params.id)
    const rules = await prisma.propertyPricing.findMany({ where: { propertyId: params.id, packageId } })
    return NextResponse.json(rules)
  } catch (err) {
    return handleApiError(err)
  }
}
