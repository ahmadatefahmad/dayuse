import type Stripe from 'stripe'
import prisma from '@/lib/prisma'
import { BookingError, priceBooking, type AddOnLine } from '@/lib/booking-quote'
import { redeemCoupon } from '@/lib/coupons'
import { sendBookingCancelled, sendBookingChanged, sendBookingConfirmed } from '@/lib/notifications'
import { getStripe, STRIPE_CURRENCY, toPiastres } from '@/lib/stripe'
import { fromDateString, toDateString, todayInEgypt } from '@/lib/utils'

// Notifications must never break a booking flow (Module 06 logs their failures).
async function notify(send: () => Promise<void>) {
  try {
    await send()
  } catch (err) {
    console.error('Notification failed', err)
  }
}

export const addOnIdsOf = (addOns: unknown) => (Array.isArray(addOns) ? (addOns as AddOnLine[]).map((a) => a.addOnId) : [])

// ---------- Confirmation (Stripe webhook) ----------

export async function handlePaymentSucceeded(pi: Stripe.PaymentIntent) {
  const bookingId = pi.metadata?.bookingId
  if (!bookingId) return
  if (pi.metadata.type === 'change') return applyPaidChange(pi)

  // Only a pending booking paid by this exact intent moves to confirmed; webhook retries are no-ops.
  const { count } = await prisma.booking.updateMany({
    where: { id: bookingId, status: 'pending', stripePaymentId: pi.id },
    data: { status: 'confirmed' },
  })
  if (!count) return
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, select: { couponCode: true, platformFee: true } })
  if (booking && toPiastres(booking.platformFee) !== pi.amount_received) {
    console.warn(`Booking ${bookingId}: paid ${pi.amount_received} piastres, expected ${toPiastres(booking.platformFee)}`)
  }
  await redeemCoupon(booking?.couponCode ?? null)
  await notify(() => sendBookingConfirmed(bookingId))
}

// Free bookings (e.g. 100% coupon) skip Stripe and are confirmed straight away.
export async function confirmFreeBooking(bookingId: string, couponCode: string | null) {
  await redeemCoupon(couponCode)
  await notify(() => sendBookingConfirmed(bookingId))
}

// ---------- Changes ----------

type ChangeTarget = {
  newDate: string
  newPackageId: string
  addOns: AddOnLine[]
  totalPrice: number
  platformFee: number
  hotelAmount: number
}

async function applyChange(bookingId: string, target: ChangeTarget, feeDiff: number, stripe: { chargeId?: string; refundId?: string } = {}) {
  const booking = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId } })
  await prisma.$transaction([
    prisma.bookingChange.create({
      data: {
        bookingId,
        oldDate: booking.bookingDate,
        newDate: fromDateString(target.newDate),
        oldPackageId: booking.packageId,
        newPackageId: target.newPackageId,
        priceDiff: feeDiff, // online amount: + charged, - refunded
        stripeChargeId: stripe.chargeId,
        stripeRefundId: stripe.refundId,
      },
    }),
    prisma.booking.update({
      where: { id: bookingId },
      data: {
        bookingDate: fromDateString(target.newDate),
        packageId: target.newPackageId,
        addOns: target.addOns,
        totalPrice: target.totalPrice,
        platformFee: target.platformFee,
        hotelAmount: target.hotelAmount,
        status: 'confirmed',
      },
    }),
  ])
  await notify(() => sendBookingChanged(bookingId))
}

// The change's details travel in the PaymentIntent metadata (values ≤ 500 chars).
async function applyPaidChange(pi: Stripe.PaymentIntent) {
  const m = pi.metadata
  const bookingId = m.bookingId
  if (await prisma.bookingChange.findFirst({ where: { stripeChargeId: pi.id } })) return // already applied
  const compact: [string, number, number][] = JSON.parse(m.addOns || '[]')
  const defs = await prisma.packageAddOn.findMany({ where: { id: { in: compact.map((c) => c[0]) } } })
  const addOns: AddOnLine[] = compact.map(([addOnId, qty, price]) => {
    const def = defs.find((d) => d.id === addOnId)
    return { addOnId, name: def?.name ?? 'Extra', price, perPerson: def?.perPerson ?? true, qty, total: price * qty }
  })
  await applyChange(
    bookingId,
    { newDate: m.newDate, newPackageId: m.newPackageId, addOns, totalPrice: Number(m.totalPrice), platformFee: Number(m.platformFee), hotelAmount: Number(m.hotelAmount) },
    Number(m.feeDiff),
    { chargeId: pi.id },
  )
}

export type ChangeResult =
  | { status: 'changed'; feeDiff: number }
  | { status: 'payment_required'; clientSecret: string; feeDiff: number }

// README rule 6: changes are free; the online booking-fee difference is charged or refunded.
// The hotel's share difference is simply settled on arrival.
export async function requestChange(bookingId: string, newDate: string, newPackageId?: string): Promise<ChangeResult> {
  const booking = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId } })
  if (booking.status !== 'confirmed') throw new BookingError('Only confirmed bookings can be changed.', 409)
  if (toDateString(booking.bookingDate) <= todayInEgypt()) throw new BookingError('Bookings can only be changed before the day of the visit.', 409)

  const packageId = newPackageId ?? booking.packageId
  if (newDate === toDateString(booking.bookingDate) && packageId === booking.packageId) throw new BookingError('Pick a different date or package.')

  const priced = await priceBooking(
    {
      propertyId: booking.propertyId,
      packageId,
      date: newDate,
      adults: booking.adults,
      children: booking.children,
      infants: booking.infants,
      // Extras belong to a package; they carry over only if the package stays the same.
      addOnIds: packageId === booking.packageId ? addOnIdsOf(booking.addOns) : [],
    },
    { discount: booking.discountAmount, excludeBookingId: booking.id },
  )
  const target: ChangeTarget = {
    newDate,
    newPackageId: packageId,
    addOns: priced.addOnLines,
    totalPrice: priced.quote.total,
    platformFee: priced.quote.platformFee,
    hotelAmount: priced.quote.hotelAmount,
  }
  const feeDiff = priced.quote.platformFee - booking.platformFee

  if (feeDiff === 0) {
    await applyChange(bookingId, target, 0)
    return { status: 'changed', feeDiff }
  }

  const stripe = getStripe()
  if (!stripe) throw new BookingError('Online payments aren’t set up yet, so this change can’t be processed.', 503)

  if (feeDiff < 0) {
    if (!booking.stripePaymentId) throw new BookingError('No online payment found to refund.', 409)
    const refund = await stripe.refunds.create({ payment_intent: booking.stripePaymentId, amount: toPiastres(-feeDiff) }, { idempotencyKey: `change-refund-${bookingId}-${newDate}-${packageId}` })
    await applyChange(bookingId, target, feeDiff, { refundId: refund.id })
    return { status: 'changed', feeDiff }
  }

  const pi = await stripe.paymentIntents.create({
    amount: toPiastres(feeDiff),
    currency: STRIPE_CURRENCY,
    automatic_payment_methods: { enabled: true },
    receipt_email: booking.guestEmail,
    description: `DayUse booking change — ${bookingId}`,
    metadata: {
      type: 'change',
      bookingId,
      newDate,
      newPackageId: packageId,
      addOns: JSON.stringify(priced.addOnLines.map((a) => [a.addOnId, a.qty, a.price])),
      totalPrice: String(target.totalPrice),
      platformFee: String(target.platformFee),
      hotelAmount: String(target.hotelAmount),
      feeDiff: String(feeDiff),
    },
  })
  return { status: 'payment_required', clientSecret: pi.client_secret!, feeDiff }
}

// ---------- Cancellation ----------

// README rule 7: refunds cover the online booking fee only (plus any change charges).
// Admins may also cancel past visits (e.g. no-show goodwill refunds); guests can't.
export async function cancelBooking(bookingId: string, opts: { byAdmin?: boolean } = {}) {
  const booking = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId }, include: { changeHistory: true } })
  if (booking.status !== 'confirmed') throw new BookingError('Only confirmed bookings can be cancelled.', 409)
  if (!opts.byAdmin && toDateString(booking.bookingDate) < todayInEgypt()) throw new BookingError('Past bookings can’t be cancelled.', 409)

  const paymentIds = [booking.stripePaymentId, ...booking.changeHistory.map((c) => c.stripeChargeId)].filter((id): id is string => Boolean(id))
  let refundId: string | null = null
  if (paymentIds.length) {
    const stripe = getStripe()
    if (!stripe) throw new BookingError('Online payments aren’t set up yet, so this booking can’t be refunded.', 503)
    for (const paymentIntent of paymentIds) {
      try {
        const refund = await stripe.refunds.create({ payment_intent: paymentIntent }, { idempotencyKey: `cancel-${bookingId}-${paymentIntent}` })
        refundId ??= refund.id
      } catch (err) {
        // A payment that is already fully refunded (e.g. by a downgrade) has nothing left to return.
        if ((err as Stripe.errors.StripeError).code !== 'charge_already_refunded') throw err
      }
    }
  }
  await prisma.booking.update({ where: { id: bookingId }, data: { status: 'cancelled', stripeRefundId: refundId } })
  await notify(() => sendBookingCancelled(bookingId))
}

// ---------- Admin actions ----------

// An unpaid checkout: void its PaymentIntent so a late payment can't go through, then cancel.
// No guest notification — they never received a confirmation.
export async function cancelPendingBooking(bookingId: string) {
  const booking = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId } })
  if (booking.status !== 'pending') throw new BookingError('Only pending bookings can be voided.', 409)
  const stripe = getStripe()
  if (booking.stripePaymentId && stripe) {
    try {
      await stripe.paymentIntents.cancel(booking.stripePaymentId)
    } catch (err) {
      const pi = await stripe.paymentIntents.retrieve(booking.stripePaymentId)
      if (pi.status === 'succeeded') throw new BookingError('The guest has just paid — refresh; the booking is about to be confirmed.', 409)
      if (pi.status !== 'canceled') throw err
    }
  }
  await prisma.booking.update({ where: { id: bookingId }, data: { status: 'cancelled' } })
}

// After the visit day has started, a confirmed booking can be marked as completed.
export async function completeBooking(bookingId: string) {
  const booking = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId } })
  if (booking.status !== 'confirmed') throw new BookingError('Only confirmed bookings can be completed.', 409)
  if (toDateString(booking.bookingDate) > todayInEgypt()) throw new BookingError('A booking can only be completed on or after the visit day.', 409)
  await prisma.booking.update({ where: { id: bookingId }, data: { status: 'completed' } })
}
