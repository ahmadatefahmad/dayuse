import { NextResponse, type NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { findReviewableBooking } from '@/lib/account'
import { handleApiError, jsonError, requireUser } from '@/lib/api'
import { ReviewSchema } from '@/lib/validations/account'

// POST { bookingId, rating, title?, body } -> a pending review (published after admin approval).
export async function POST(request: NextRequest) {
  const auth = await requireUser()
  if (auth instanceof NextResponse) return auth
  try {
    const input = ReviewSchema.parse(await request.json())
    // README rule 3, re-checked here: own booking, visit already happened, confirmed, not yet reviewed.
    const booking = await findReviewableBooking(auth.id, input.bookingId)
    if (!booking) return jsonError('This booking can’t be reviewed (yet).', 403)

    const review = await prisma.review.create({
      data: {
        bookingId: booking.id,
        userId: auth.id,
        propertyId: booking.propertyId,
        rating: input.rating,
        title: input.title || null,
        body: input.body,
        status: 'pending',
      },
    })
    return NextResponse.json({ id: review.id, status: review.status }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
