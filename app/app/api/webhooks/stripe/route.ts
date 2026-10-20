import { NextResponse, type NextRequest } from 'next/server'
import Stripe from 'stripe'
import prisma from '@/lib/prisma'
import { jsonError } from '@/lib/api'
import { handlePaymentSucceeded } from '@/lib/bookings'

export const dynamic = 'force-dynamic'

// Stripe signs the raw body, so read it as text (App Router has no body parser to disable).
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return jsonError('Stripe webhooks are not configured', 503)

  const body = await request.text()
  let event: Stripe.Event
  try {
    event = Stripe.webhooks.constructEvent(body, request.headers.get('stripe-signature') ?? '', secret)
  } catch {
    return jsonError('Invalid signature', 400)
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object)
        break
      case 'payment_intent.payment_failed':
        // Keep the booking pending so the guest can retry with another card.
        console.warn('Payment failed', event.data.object.id, event.data.object.last_payment_error?.message)
        break
      case 'charge.refunded': {
        const charge = event.data.object
        const refundId = charge.refunds?.data[0]?.id
        const pi = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id
        if (pi && refundId) await prisma.booking.updateMany({ where: { stripePaymentId: pi, stripeRefundId: null }, data: { stripeRefundId: refundId } })
        break
      }
    }
  } catch (err) {
    // A 500 makes Stripe retry later; the handlers are idempotent.
    console.error(`Webhook ${event.type} failed`, err)
    return jsonError('Webhook handler failed', 500)
  }
  return NextResponse.json({ received: true })
}
