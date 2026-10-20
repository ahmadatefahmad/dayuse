import { NextResponse, type NextRequest } from 'next/server'
import { getUserBooking } from '@/lib/account'
import { handleApiError, jsonError, requireUser } from '@/lib/api'

export const dynamic = 'force-dynamic'

// GET -> one booking, only if it belongs to the signed-in guest.
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser()
  if (auth instanceof NextResponse) return auth
  try {
    const booking = await getUserBooking(auth.id, params.id)
    if (!booking) return jsonError('Booking not found', 404)
    const { accessToken: _token, ...rest } = booking
    return NextResponse.json(rest)
  } catch (err) {
    return handleApiError(err)
  }
}
