import { NextResponse, type NextRequest } from 'next/server'
import { addDays, format, parseISO } from 'date-fns'
import prisma from '@/lib/prisma'
import { handleApiError } from '@/lib/api'
import { rejectUnlessCron } from '@/lib/cron'
import { sendReviewRequest } from '@/lib/notifications'
import { fromDateString, todayInEgypt } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const DAYS_AFTER_VISIT = 3

// Daily: ask guests who visited 3 days ago (confirmed, not yet reviewed) for a review.
export async function GET(request: NextRequest) {
  const denied = rejectUnlessCron(request)
  if (denied) return denied
  try {
    const visitDay = format(addDays(parseISO(todayInEgypt()), -DAYS_AFTER_VISIT), 'yyyy-MM-dd')
    const bookings = await prisma.booking.findMany({
      where: { status: 'confirmed', bookingDate: fromDateString(visitDay), reviews: { none: {} } },
      select: { id: true },
    })
    for (const b of bookings) await sendReviewRequest(b.id)
    return NextResponse.json({ visitDay, processed: bookings.length })
  } catch (err) {
    return handleApiError(err)
  }
}
