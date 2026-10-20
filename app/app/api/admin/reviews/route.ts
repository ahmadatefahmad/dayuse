import { NextResponse, type NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { handleApiError, requireAdmin } from '@/lib/api'

export const dynamic = 'force-dynamic'
const STATUSES = ['pending', 'approved', 'rejected']

// GET ?status=pending|approved|rejected (omit for all) -> newest first, max 200.
export async function GET(request: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied
  const status = request.nextUrl.searchParams.get('status')
  try {
    const reviews = await prisma.review.findMany({
      where: status && STATUSES.includes(status) ? { status } : {},
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { property: { select: { id: true, name: true } }, booking: { select: { guestName: true, bookingDate: true } } },
    })
    return NextResponse.json(reviews)
  } catch (err) {
    return handleApiError(err)
  }
}
