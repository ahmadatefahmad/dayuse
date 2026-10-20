import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { handleApiError, requireAdmin } from '@/lib/api'

// PATCH { active } — coupons are deactivated, never deleted, so past bookings keep their code.
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin()
  if (denied) return denied
  try {
    const { active } = z.object({ active: z.boolean() }).parse(await request.json())
    const coupon = await prisma.coupon.update({ where: { id: params.id }, data: { active } })
    return NextResponse.json(coupon)
  } catch (err) {
    return handleApiError(err)
  }
}
