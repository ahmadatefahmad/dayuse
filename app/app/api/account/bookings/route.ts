import { NextResponse, type NextRequest } from 'next/server'
import { BOOKING_TABS, listUserBookings, type BookingTab } from '@/lib/account'
import { handleApiError, requireUser } from '@/lib/api'

export const dynamic = 'force-dynamic'

// GET ?tab=upcoming|past|cancelled -> the signed-in guest's bookings with property + package.
export async function GET(request: NextRequest) {
  const auth = await requireUser()
  if (auth instanceof NextResponse) return auth
  const tabParam = request.nextUrl.searchParams.get('tab')
  const tab: BookingTab = BOOKING_TABS.find((t) => t === tabParam) ?? 'upcoming'
  try {
    const bookings = await listUserBookings(auth.id, tab)
    // The access token stays server-side; owners don't need it.
    return NextResponse.json(bookings.map(({ accessToken: _token, ...b }) => b))
  } catch (err) {
    return handleApiError(err)
  }
}
