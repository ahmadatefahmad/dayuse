import { NextResponse, type NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { handleApiError, jsonError, requireAdmin, revalidatePublicPages } from '@/lib/api'
import { PackageSchema } from '@/lib/validations/property'

// Full update: the body is the whole package including its add-ons list.
// Add-ons with an id are updated, ones without are created, and missing ones are deleted.
export async function PATCH(request: NextRequest, { params }: { params: { id: string; pkgId: string } }) {
  const denied = await requireAdmin()
  if (denied) return denied

  try {
    const { addOns, ...data } = PackageSchema.parse(await request.json())
    const existing = await prisma.package.findFirst({ where: { id: params.pkgId, propertyId: params.id }, select: { id: true } })
    if (!existing) return jsonError('Package not found', 404)

    const keptIds = addOns.flatMap((a) => (a.id ? [a.id] : []))
    const pkg = await prisma.$transaction(async (tx) => {
      await tx.package.update({ where: { id: params.pkgId }, data })
      await tx.packageAddOn.deleteMany({ where: { packageId: params.pkgId, id: { notIn: keptIds } } })
      for (const { id, ...addOn } of addOns) {
        if (id) await tx.packageAddOn.updateMany({ where: { id, packageId: params.pkgId }, data: addOn })
        else await tx.packageAddOn.create({ data: { ...addOn, packageId: params.pkgId } })
      }
      return tx.package.findUniqueOrThrow({ where: { id: params.pkgId }, include: { addOns: true } })
    })
    revalidatePublicPages(params.id)
    return NextResponse.json(pkg)
  } catch (err) {
    return handleApiError(err)
  }
}
