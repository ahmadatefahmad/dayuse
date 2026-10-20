import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { handleApiError, requireUser } from '@/lib/api'

export const dynamic = 'force-dynamic'

// GET -> every review the signed-in guest has written, any status.
export async function GET() {
  const auth = await requireUser()
  if (auth instanceof NextResponse) return auth
  try {
    const reviews = await prisma.review.findMany({
      where: { userId: auth.id },
      orderBy: { createdAt: 'desc' },
      include: { property: { select: { id: true, name: true, coverImage: true } }, booking: { select: { bookingDate: true } } },
    })
    return NextResponse.json(reviews)
  } catch (err) {
    return handleApiError(err)
  }
}
