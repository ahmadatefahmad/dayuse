import { NextResponse, type NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { REVIEWABLE_STATUSES } from '@/lib/account'
import { handleApiError } from '@/lib/api'
import { fromDateString, todayInEgypt } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// GET -> { bookingId } for the signed-in guest's most recent past confirmed booking here
// that they haven't reviewed yet (README rule 3), otherwise { bookingId: null }.
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ bookingId: null })

    const booking = await prisma.booking.findFirst({
      where: {
        userId: user.id,
        propertyId: params.id,
        status: { in: REVIEWABLE_STATUSES },
        bookingDate: { lt: fromDateString(todayInEgypt()) },
        reviews: { none: { userId: user.id } },
      },
      orderBy: { bookingDate: 'desc' },
      select: { id: true },
    })
    return NextResponse.json({ bookingId: booking?.id ?? null })
  } catch (err) {
    return handleApiError(err)
  }
}
