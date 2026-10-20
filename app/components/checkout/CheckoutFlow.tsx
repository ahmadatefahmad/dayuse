'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format, parseISO } from 'date-fns'
import { Check, Tag, X } from 'lucide-react'
import { PriceBreakdown } from '@/components/booking/PriceBreakdown'
import { StripePayment } from '@/components/checkout/StripePayment'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input, Textarea } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { Spinner } from '@/components/ui/Spinner'
import { ApiError, apiFetch, NetworkError } from '@/lib/fetcher'
import { calculateQuote } from '@/lib/pricing'
import { useCheckoutStore, type CheckoutStep } from '@/lib/stores/checkoutStore'
import { createClient } from '@/lib/supabase'
import { cn, formatEGP } from '@/lib/utils'
import { PropertyImage } from '@/components/property/PropertyImage'
import { GuestDetailsSchema, type GuestDetailsInput } from '@/lib/validations/booking'

export type CheckoutData = {
  selectionKey: string
  selection: { propertyId: string; packageId: string; date: string; adults: number; children: number; infants: number; addOnIds: string[] }
  property: { id: string; name: string; coverImage: string; location: string; hours: string | null }
  packageName: string
  infantFree: boolean
  price: { adultPrice: number; childPrice: number }
  addOns: { addOnId: string; name: string; price: number; perPerson: boolean }[]
}

const STEPS: { n: CheckoutStep; label: string }[] = [
  { n: 1, label: 'Review' },
  { n: 2, label: 'Your details' },
  { n: 3, label: 'Price' },
  { n: 4, label: 'Payment' },
]

type CreatedBooking = { bookingId: string; accessToken: string; clientSecret: string | null; amount: number }

const DATE_GONE = 'Sorry, this date just became unavailable. Please choose another date.'

// Guest-facing wording for booking failures. Nothing is ever charged before the payment step.
function bookingErrorMessage(e: unknown) {
  if (e instanceof NetworkError || (e instanceof ApiError && e.status >= 500 && e.status !== 503)) return 'Something went wrong. Your card has not been charged.'
  if (e instanceof ApiError && e.status === 409 && /date|spots|closed|passed/i.test(e.message)) return DATE_GONE
  return (e as Error).message
}

export function CheckoutFlow({ data }: { data: CheckoutData }) {
  const router = useRouter()
  const [hydrated, setHydrated] = useState(false)
  const store = useCheckoutStore()
  const { step, setStep, discountAmount } = store

  useEffect(() => {
    Promise.resolve(useCheckoutStore.persist.rehydrate()).then(() => {
      useCheckoutStore.getState().start(data.selectionKey)
      setHydrated(true)
    })
  }, [data.selectionKey])

  const { selection } = data
  const quote = useMemo(
    () => calculateQuote({ ...data.price, infantFree: data.infantFree, adults: selection.adults, children: selection.children, infants: selection.infants, addOns: data.addOns, discount: discountAmount }),
    [data, selection, discountAmount],
  )

  const [leaving, setLeaving] = useState(false)
  const goToBooking = (id: string, token: string) => {
    setLeaving(true) // freeze the UI so the reset below doesn't flash undiscounted prices
    useCheckoutStore.getState().finish()
    router.push(`/booking/${id}?t=${encodeURIComponent(token)}`)
  }

  if (leaving) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-grey-500">
        <Spinner className="h-8 w-8" />
        <p>Opening your booking…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="text-3xl text-navy sm:text-4xl">Checkout</h1>
      <ol className="mt-6 flex gap-2 overflow-x-auto [scrollbar-width:none]" aria-label="Checkout steps">
        {STEPS.map(({ n, label }) => {
          const done = hydrated && n < step
          const current = hydrated && n === step
          return (
            <li key={n} className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                disabled={!done}
                onClick={() => setStep(n)}
                className={cn('flex items-center gap-2 rounded-full px-3 py-1.5 text-sm', current ? 'bg-navy text-white' : done ? 'bg-teal/15 text-teal hover:bg-teal/25' : 'bg-grey-100 text-grey-500')}
                aria-current={current ? 'step' : undefined}
              >
                <span className={cn('flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold', current ? 'bg-white text-navy' : done ? 'bg-teal text-white' : 'bg-white text-grey-500')}>
                  {done ? <Check className="h-3 w-3" /> : n}
                </span>
                <span className="sr-only sm:not-sr-only">{label}</span>
              </button>
              {n < 4 && <span className="h-px w-4 bg-grey-300" />}
            </li>
          )
        })}
      </ol>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="min-w-0">
          {!hydrated ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : step === 1 ? (
            <ReviewStep data={data} onNext={() => setStep(2)} />
          ) : step === 2 ? (
            <DetailsStep onNext={() => setStep(3)} />
          ) : step === 3 ? (
            <PriceStep data={data} subtotal={quote.subtotal} quote={quote} onCreated={(b) => (b.clientSecret ? setStep(4) : goToBooking(b.bookingId, b.accessToken))} />
          ) : (
            <PaymentStep onPaid={goToBooking} />
          )}
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-xl border border-grey-100 bg-white shadow-sm">
            <div className="relative h-36 w-full">
              <PropertyImage src={data.property.coverImage} alt="" sizes="(min-width: 1024px) 380px, 100vw" />
            </div>
            <div className="space-y-4 p-5">
              <div>
                <p className="font-playfair text-xl text-navy">{data.property.name}</p>
                <p className="text-sm text-grey-500">{data.property.location}</p>
              </div>
              <p className="text-sm text-navy">
                <strong>{format(parseISO(selection.date), 'EEEE d MMMM yyyy')}</strong>
                {data.property.hours && <span className="text-grey-500"> · {data.property.hours}</span>}
              </p>
              <PriceBreakdown
                quote={quote}
                packageName={data.packageName}
                guests={selection}
                infantFree={data.infantFree}
                addOns={data.addOns}
                className="border-t border-grey-100 pt-4"
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function ReviewStep({ data, onNext }: { data: CheckoutData; onNext: () => void }) {
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { selection } = data

  // Re-check right before continuing: someone may have taken the last spots meanwhile.
  async function next() {
    setChecking(true)
    setError(null)
    try {
      const a = await apiFetch<{ available: boolean }>(`/api/properties/${selection.propertyId}/availability?date=${selection.date}&adults=${selection.adults}`)
      if (a.available) onNext()
      else setError(DATE_GONE)
    } catch (e) {
      setError(bookingErrorMessage(e))
    } finally {
      setChecking(false)
    }
  }

  const guests = [`${selection.adults} adult${selection.adults === 1 ? '' : 's'}`, selection.children && `${selection.children} child${selection.children === 1 ? '' : 'ren'}`, selection.infants && `${selection.infants} infant${selection.infants === 1 ? '' : 's'}`].filter(Boolean).join(', ')

  return (
    <div className="space-y-6">
      <h2 className="text-2xl text-navy">Review your day</h2>
      <dl className="divide-y divide-grey-100 rounded-xl border border-grey-100 bg-white">
        {[
          ['Property', data.property.name],
          ['Date', format(parseISO(selection.date), 'EEEE d MMMM yyyy')],
          ['Package', data.packageName],
          ['Guests', guests],
          ['Extras', data.addOns.length ? data.addOns.map((a) => a.name).join(', ') : 'None'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-5 py-3 text-sm">
            <dt className="text-grey-500">{k}</dt>
            <dd className="text-right font-medium text-navy">{v}</dd>
          </div>
        ))}
      </dl>
      {error && (
        <p className="rounded-lg bg-coral/10 p-3 text-sm text-coral">
          {error}{' '}
          <a href={`/property/${selection.propertyId}`} className="font-medium underline">
            Back to the property
          </a>
        </p>
      )}
      <div className="flex justify-between gap-3">
        <a href={`/property/${selection.propertyId}`} className="text-sm text-grey-500 hover:text-navy">
          ← Edit selection
        </a>
        <Button size="lg" onClick={next} loading={checking}>
          Continue
        </Button>
      </div>
    </div>
  )
}

function DetailsStep({ onNext }: { onNext: () => void }) {
  const guest = useCheckoutStore((s) => s.guest)
  const setGuest = useCheckoutStore((s) => s.setGuest)
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<GuestDetailsInput>({ resolver: zodResolver(GuestDetailsSchema), defaultValues: guest })

  // Signed-in guests: pre-fill email (and name if the profile has one).
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        const user = data.user
        if (!user) return
        if (!getValues('guestEmail') && user.email) setValue('guestEmail', user.email)
        const name = user.user_metadata?.full_name ?? user.user_metadata?.name
        if (!getValues('guestName') && typeof name === 'string') setValue('guestName', name)
      })
  }, [getValues, setValue])

  return (
    <form
      onSubmit={handleSubmit((values) => {
        const parsed = GuestDetailsSchema.parse(values)
        setGuest({ ...parsed, specialRequests: parsed.specialRequests ?? '' })
        onNext()
      })}
      className="space-y-5"
      noValidate
    >
      <h2 className="text-2xl text-navy">Your details</h2>
      <p className="text-sm text-grey-500">We&apos;ll send your confirmation here. The hotel uses your name to check you in.</p>
      <Field label="Full name" htmlFor="guestName" error={errors.guestName?.message}>
        <Input id="guestName" autoComplete="name" {...register('guestName')} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Email" htmlFor="guestEmail" error={errors.guestEmail?.message}>
          <Input id="guestEmail" type="email" autoComplete="email" {...register('guestEmail')} />
        </Field>
        <Field label="Mobile (WhatsApp)" htmlFor="guestPhone" error={errors.guestPhone?.message} hint="Egyptian mobile, e.g. +20 10 1234 5678">
          <Input id="guestPhone" type="tel" autoComplete="tel" placeholder="+20 10 1234 5678" {...register('guestPhone')} />
        </Field>
      </div>
      <Field label="Special requests (optional)" htmlFor="specialRequests" error={errors.specialRequests?.message}>
        <Textarea id="specialRequests" rows={3} className="min-h-[90px]" placeholder="Dietary needs, celebrations, accessibility…" {...register('specialRequests')} />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" size="lg">
          Continue
        </Button>
      </div>
    </form>
  )
}

function PriceStep({ data, subtotal, quote, onCreated }: { data: CheckoutData; subtotal: number; quote: ReturnType<typeof calculateQuote>; onCreated: (b: CreatedBooking) => void }) {
  const { guest, couponCode, applyCoupon, removeCoupon, booking, setBooking, selectionKey } = useCheckoutStore()
  const [code, setCode] = useState(couponCode ?? '')
  const [couponError, setCouponError] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // A booking error (e.g. payments unavailable) no longer applies once the price changes.
  useEffect(() => setError(null), [couponCode])

  async function apply() {
    if (!code.trim()) return
    setApplying(true)
    setCouponError(null)
    try {
      const res = await apiFetch<{ valid: true; code: string; discount: number } | { valid: false; reason: string }>('/api/coupons/validate', {
        method: 'POST',
        json: { code: code.trim(), totalPrice: subtotal },
      })
      if (res.valid) applyCoupon(res.code, res.discount)
      else setCouponError(res.reason)
    } catch (e) {
      setCouponError((e as Error).message)
    } finally {
      setApplying(false)
    }
  }

  async function continueToPayment() {
    const signature = JSON.stringify([selectionKey, guest, couponCode])
    if (booking?.signature === signature) return onCreated({ bookingId: booking.id, accessToken: booking.token, clientSecret: booking.clientSecret, amount: booking.amount })
    setSubmitting(true)
    setError(null)
    try {
      const created = await apiFetch<CreatedBooking>('/api/bookings', { method: 'POST', json: { ...data.selection, ...guest, couponCode } })
      if (created.clientSecret) setBooking({ id: created.bookingId, token: created.accessToken, clientSecret: created.clientSecret, amount: created.amount, signature })
      onCreated(created)
    } catch (e) {
      setError(bookingErrorMessage(e))
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl text-navy">Final price</h2>

      <div className="rounded-xl border border-grey-100 bg-white p-5">
        <p className="mb-3 flex items-center gap-2 text-sm font-medium text-navy">
          <Tag className="h-4 w-4 text-coral" /> Have a promo code?
        </p>
        {couponCode ? (
          <div className="flex items-center justify-between rounded-lg bg-teal/10 px-3 py-2 text-sm">
            <span className="text-teal">
              <strong>{couponCode}</strong> applied — you save {formatEGP(quote.discount)}
            </span>
            <button type="button" onClick={removeCoupon} className="text-grey-500 hover:text-navy" aria-label="Remove promo code">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  apply()
                }
              }}
              placeholder="SUMMER10"
              aria-label="Promo code"
            />
            <Button variant="secondary" onClick={apply} loading={applying} disabled={!code.trim()}>
              Apply
            </Button>
          </div>
        )}
        {couponError && <p className="mt-2 text-xs text-red-600">{couponError}</p>}
      </div>

      <div className="space-y-3 rounded-xl border border-grey-100 bg-white p-5 text-sm">
        <Row label="Subtotal" value={formatEGP(quote.subtotal)} />
        {quote.discount > 0 && <Row label={`Discount (${couponCode})`} value={`−${formatEGP(quote.discount)}`} />}
        <div className="flex items-baseline justify-between border-t border-grey-100 pt-3 text-base">
          <strong className="text-navy">Total</strong>
          <strong className="text-navy">{formatEGP(quote.total)}</strong>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-coral/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-coral">Pay online now</p>
            <p className="mt-1 font-playfair text-2xl text-navy">{formatEGP(quote.platformFee)}</p>
            <p className="text-xs text-grey-500">Booking fee, charged by DayUse</p>
          </div>
          <div className="rounded-lg bg-teal/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal">Pay on arrival</p>
            <p className="mt-1 font-playfair text-2xl text-navy">{formatEGP(quote.hotelAmount)}</p>
            <p className="text-xs text-grey-500">Paid directly to {data.property.name}</p>
          </div>
        </div>
        <p className="text-xs text-grey-500">Changes are free. Cancel before your visit and the online booking fee is refunded.</p>
      </div>

      {error && <p className="rounded-lg bg-coral/10 p-3 text-sm text-coral">{error}</p>}
      <div className="flex justify-end">
        <Button size="lg" onClick={continueToPayment} loading={submitting}>
          {quote.platformFee > 0 ? `Continue to payment` : 'Confirm booking'}
        </Button>
      </div>
    </div>
  )
}

function PaymentStep({ onPaid }: { onPaid: (id: string, token: string) => void }) {
  const booking = useCheckoutStore((s) => s.booking)
  const setStep = useCheckoutStore((s) => s.setStep)
  if (!booking) {
    return (
      <p className="text-sm text-grey-500">
        Your booking session expired.{' '}
        <button type="button" className="text-coral underline" onClick={() => setStep(3)}>
          Go back to the price step
        </button>
      </p>
    )
  }
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl text-navy">Payment</h2>
        <p className="mt-1 text-sm text-grey-500">You&apos;re paying the booking fee only. The rest is paid at the hotel on the day.</p>
      </div>
      <div className="rounded-xl border border-grey-100 bg-white p-5">
        <StripePayment clientSecret={booking.clientSecret} amount={booking.amount} returnPath={`/booking/${booking.id}?t=${encodeURIComponent(booking.token)}`} onPaid={() => onPaid(booking.id, booking.token)} />
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-grey-700">
      <span>{label}</span>
      <span className="text-navy">{value}</span>
    </div>
  )
}
