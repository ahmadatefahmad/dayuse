import { NextResponse, type NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { handleApiError, jsonError } from '@/lib/api'
import { newAccessToken } from '@/lib/booking-access'
import { priceBooking } from '@/lib/booking-quote'
import { confirmFreeBooking } from '@/lib/bookings'
import { validateCoupon } from '@/lib/coupons'
import { calculateQuote } from '@/lib/pricing'
import { getStripe, STRIPE_CURRENCY, toPiastres } from '@/lib/stripe'
import { fromDateString } from '@/lib/utils'
import { CreateBookingSchema } from '@/lib/validations/booking'

// Creates a pending booking and a Stripe PaymentIntent for the online booking fee.
// Everything is re-priced and re-checked here; the browser's numbers are never trusted.
export async function POST(request: NextRequest) {
  try {
    const input = CreateBookingSchema.parse(await request.json())
    const selection = { propertyId: input.propertyId, packageId: input.packageId, date: input.date, adults: input.adults, children: input.children, infants: input.infants, addOnIds: input.addOnIds }
    const priced = await priceBooking(selection)

    let discount = 0
    let couponCode: string | null = null
    if (input.couponCode) {
      const coupon = await validateCoupon(input.couponCode, priced.quote.subtotal)
      if (!coupon.valid) return jsonError(coupon.reason, 400)
      discount = coupon.discount
      couponCode = coupon.code
    }
    const quote = discount ? calculateQuote({ ...priced.price, infantFree: priced.pkg.infantFree, adults: input.adults, children: input.children, infants: input.infants, addOns: priced.addOnLines, discount }) : priced.quote

    const stripe = getStripe()
    if (quote.platformFee > 0 && !stripe) return jsonError('Online payments aren’t set up yet. Please try again later.', 503)

    // Link the booking to the signed-in guest, creating their profile row on first booking.
    const user = await getCurrentUser()
    if (user?.email) {
      await prisma.user.upsert({ where: { id: user.id }, update: {}, create: { id: user.id, email: user.email, name: input.guestName, phone: input.guestPhone } })
    }

    const free = quote.platformFee === 0
    const booking = await prisma.booking.create({
      data: {
        userId: user?.id ?? null,
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        guestPhone: input.guestPhone,
        specialRequests: input.specialRequests || null,
        propertyId: input.propertyId,
        packageId: input.packageId,
        bookingDate: fromDateString(input.date),
        adults: input.adults,
        children: input.children,
        infants: input.infants,
        addOns: priced.addOnLines,
        totalPrice: quote.total,
        platformFee: quote.platformFee,
        hotelAmount: quote.hotelAmount,
        couponCode,
        discountAmount: quote.discount,
        status: free ? 'confirmed' : 'pending',
        accessToken: newAccessToken(),
      },
    })

    if (free) {
      await confirmFreeBooking(booking.id, couponCode)
      return NextResponse.json({ bookingId: booking.id, accessToken: booking.accessToken, clientSecret: null, amount: 0 }, { status: 201 })
    }

    try {
      const pi = await stripe!.paymentIntents.create(
        {
          amount: toPiastres(quote.platformFee),
          currency: STRIPE_CURRENCY,
          automatic_payment_methods: { enabled: true },
          receipt_email: input.guestEmail,
          description: `DayUse booking fee — ${priced.property.name}, ${input.date}`,
          metadata: { bookingId: booking.id },
        },
        { idempotencyKey: `booking-${booking.id}` },
      )
      await prisma.booking.update({ where: { id: booking.id }, data: { stripePaymentId: pi.id } })
      return NextResponse.json({ bookingId: booking.id, accessToken: booking.accessToken, clientSecret: pi.client_secret, amount: quote.platformFee }, { status: 201 })
    } catch (err) {
      // No payment could be started, so the booking never existed as far as the guest is concerned.
      await prisma.booking.delete({ where: { id: booking.id } })
      throw err
    }
  } catch (err) {
    return handleApiError(err)
  }
}
