import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { handleApiError, jsonError, requireAdmin } from '@/lib/api'
import { cancelBooking, cancelPendingBooking, completeBooking } from '@/lib/bookings'

const ActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('complete') }),
  z.object({ action: z.literal('cancel') }),
  z.object({ action: z.literal('note'), note: z.string().max(5000) }),
])

// PATCH { action: 'complete' | 'cancel' | 'note', note? }
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await requireAdmin()
  if (denied) return denied
  try {
    const input = ActionSchema.parse(await request.json())
    const booking = await prisma.booking.findUnique({ where: { id: params.id }, select: { status: true } })
    if (!booking) return jsonError('Booking not found', 404)

    if (input.action === 'note') {
      await prisma.booking.update({ where: { id: params.id }, data: { internalNotes: input.note.trim() || null } })
    } else if (input.action === 'complete') {
      await completeBooking(params.id)
    } else if (booking.status === 'pending') {
      await cancelPendingBooking(params.id)
    } else {
      // Same refund + guest notification path as a guest cancellation (Module 05).
      await cancelBooking(params.id, { byAdmin: true })
    }
    const updated = await prisma.booking.findUniqueOrThrow({ where: { id: params.id }, select: { status: true, internalNotes: true, stripeRefundId: true } })
    return NextResponse.json(updated)
  } catch (err) {
    return handleApiError(err)
  }
}
