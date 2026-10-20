import { NextResponse, type NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { handleApiError, jsonError } from '@/lib/api'
import { canAccessBooking } from '@/lib/booking-access'
import { cancelBooking, requestChange } from '@/lib/bookings'
import { BookingActionSchema } from '@/lib/validations/booking'

// PATCH { action: 'cancel', token } or { action: 'change', token, newDate, newPackageId? }
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const action = BookingActionSchema.parse(await request.json())
    const booking = await prisma.booking.findUnique({ where: { id: params.id }, select: { id: true, userId: true, accessToken: true } })
    // Same answer for "missing" and "not yours", so booking ids can't be probed.
    if (!booking || !(await canAccessBooking(booking, action.token))) return jsonError('Booking not found', 404)

    if (action.action === 'cancel') {
      await cancelBooking(booking.id)
      return NextResponse.json({ status: 'cancelled' })
    }
    return NextResponse.json(await requestChange(booking.id, action.newDate, action.newPackageId))
  } catch (err) {
    return handleApiError(err)
  }
}
