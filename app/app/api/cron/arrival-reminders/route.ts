import { NextResponse, type NextRequest } from 'next/server'
import { addDays, format, parseISO } from 'date-fns'
import prisma from '@/lib/prisma'
import { handleApiError } from '@/lib/api'
import { rejectUnlessCron } from '@/lib/cron'
import { sendArrivalReminder } from '@/lib/notifications'
import { fromDateString, todayInEgypt } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// Daily: remind guests visiting tomorrow how much they'll pay at the hotel.
export async function GET(request: NextRequest) {
  const denied = rejectUnlessCron(request)
  if (denied) return denied
  try {
    const tomorrow = format(addDays(parseISO(todayInEgypt()), 1), 'yyyy-MM-dd')
    const bookings = await prisma.booking.findMany({ where: { status: 'confirmed', bookingDate: fromDateString(tomorrow) }, select: { id: true } })
    for (const b of bookings) await sendArrivalReminder(b.id)
    return NextResponse.json({ date: tomorrow, processed: bookings.length })
  } catch (err) {
    return handleApiError(err)
  }
}
