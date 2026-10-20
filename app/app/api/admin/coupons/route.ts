import { NextResponse, type NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { handleApiError, jsonError, requireAdmin } from '@/lib/api'
import { cairoStartOfDay } from '@/lib/utils'
import { CouponSchema } from '@/lib/validations/coupon'
import { addDays, format, parseISO } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET() {
  const denied = await requireAdmin()
  if (denied) return denied
  const coupons = await prisma.coupon.findMany({ orderBy: [{ active: 'desc' }, { createdAt: 'desc' }] })
  return NextResponse.json(coupons)
}

// POST -> create. Codes are unique case-insensitively (checkout matches them that way).
export async function POST(request: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied
  try {
    const c = CouponSchema.parse(await request.json())
    if (await prisma.coupon.findFirst({ where: { code: { equals: c.code, mode: 'insensitive' } } })) {
      return jsonError(`The code ${c.code} already exists`, 409)
    }
    const coupon = await prisma.coupon.create({
      data: {
        code: c.code,
        type: c.type,
        value: c.value,
        minBookingTotal: c.minBookingTotal,
        maxUses: c.maxUses,
        // "Expires 31 Dec" means usable all of 31 Dec, Cairo time.
        expiresAt: c.expiresAt ? cairoStartOfDay(format(addDays(parseISO(c.expiresAt), 1), 'yyyy-MM-dd')) : null,
        active: c.active,
      },
    })
    return NextResponse.json(coupon, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
