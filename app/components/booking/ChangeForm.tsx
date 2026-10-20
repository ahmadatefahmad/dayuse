'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { addDays, format, parseISO } from 'date-fns'
import { DateCalendar } from '@/components/booking/DateCalendar'
import { StripePayment } from '@/components/checkout/StripePayment'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { apiFetch } from '@/lib/fetcher'
import { calculateQuote, resolvePrice, type PriceRule } from '@/lib/pricing'
import { cn, formatEGP, todayInEgypt } from '@/lib/utils'

type Pkg = { id: string; name: string; adultPrice: number; childPrice: number; infantFree: boolean; addOns: { id: string; price: number; perPerson: boolean }[] }

type Props = {
  booking: {
    id: string
    token: string | null
    date: string
    packageId: string
    adults: number
    children: number
    infants: number
    addOnIds: string[]
    discountAmount: number
    totalPrice: number
    platformFee: number
    hotelAmount: number
  }
  packages: Pkg[]
  rules: PriceRule[]
  blackoutDates: string[]
}

type ChangeResponse = { status: 'changed'; feeDiff: number } | { status: 'payment_required'; clientSecret: string; feeDiff: number }

export function ChangeForm({ booking, packages, rules, blackoutDates }: Props) {
  const router = useRouter()
  const [date, setDate] = useState(booking.date)
  const [packageId, setPackageId] = useState(booking.packageId)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payment, setPayment] = useState<{ clientSecret: string; amount: number } | null>(null)

  // Same rules as the server: extras only carry over when the package stays the same.
  const next = useMemo(() => {
    const pkg = packages.find((p) => p.id === packageId)!
    const addOns = packageId === booking.packageId ? pkg.addOns.filter((a) => booking.addOnIds.includes(a.id)) : []
    return calculateQuote({ ...resolvePrice(pkg, rules, date), infantFree: pkg.infantFree, adults: booking.adults, children: booking.children, infants: booking.infants, addOns, discount: booking.discountAmount })
  }, [packageId, date, packages, rules, booking])

  const unchanged = date === booking.date && packageId === booking.packageId
  const feeDiff = next.platformFee - booking.platformFee
  const bookingPath = `/booking/${booking.id}${booking.token ? `?t=${encodeURIComponent(booking.token)}` : ''}`
  const min = format(addDays(parseISO(todayInEgypt()), 1), 'yyyy-MM-dd') // changes must be before the visit day
  const max = format(addDays(parseISO(todayInEgypt()), 365), 'yyyy-MM-dd')

  async function submit() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await apiFetch<ChangeResponse>(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        json: { action: 'change', token: booking.token ?? undefined, newDate: date, newPackageId: packageId },
      })
      if (res.status === 'payment_required') setPayment({ clientSecret: res.clientSecret, amount: res.feeDiff })
      else {
        router.push(bookingPath)
        router.refresh()
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (payment) {
    return (
      <div className="space-y-4 rounded-xl border border-grey-100 bg-white p-6">
        <h2 className="text-xl text-navy">Pay the difference</h2>
        <p className="text-sm text-grey-500">Your change goes through as soon as this payment is confirmed.</p>
        <StripePayment clientSecret={payment.clientSecret} amount={payment.amount} returnPath={bookingPath} onPaid={() => router.push(bookingPath)} />
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-5 rounded-xl border border-grey-100 bg-white p-5">
        <div>
          <p className="mb-2 text-sm font-medium text-navy">New date</p>
          <DateCalendar value={date} onChange={setDate} min={min} max={max} blocked={new Set(blackoutDates)} />
        </div>
        {packages.length > 1 && (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-navy">Package</span>
            <Select value={packageId} onChange={(e) => setPackageId(e.target.value)}>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
            {packageId !== booking.packageId && booking.addOnIds.length > 0 && <span className="mt-1 block text-xs text-coral">Extras from your current package won&apos;t carry over.</span>}
          </label>
        )}
      </div>

      <div className="space-y-4 rounded-xl border border-grey-100 bg-white p-5 text-sm">
        <h2 className="text-lg text-navy">Price comparison</h2>
        <table className="w-full">
          <thead className="text-left text-xs uppercase tracking-wide text-grey-500">
            <tr>
              <th className="pb-2 font-medium" />
              <th className="pb-2 font-medium">Current</th>
              <th className="pb-2 font-medium">New</th>
            </tr>
          </thead>
          <tbody className="text-navy">
            <tr>
              <td className="py-1 text-grey-500">Date</td>
              <td>{format(parseISO(booking.date), 'd MMM')}</td>
              <td className={cn(date !== booking.date && 'font-semibold')}>{format(parseISO(date), 'd MMM')}</td>
            </tr>
            <tr>
              <td className="py-1 text-grey-500">Total</td>
              <td>{formatEGP(booking.totalPrice)}</td>
              <td className="font-semibold">{formatEGP(next.total)}</td>
            </tr>
            <tr>
              <td className="py-1 text-grey-500">Online fee</td>
              <td>{formatEGP(booking.platformFee)}</td>
              <td>{formatEGP(next.platformFee)}</td>
            </tr>
            <tr>
              <td className="py-1 text-grey-500">On arrival</td>
              <td>{formatEGP(booking.hotelAmount)}</td>
              <td>{formatEGP(next.hotelAmount)}</td>
            </tr>
          </tbody>
        </table>

        {!unchanged && (
          <p className={cn('rounded-lg p-3', feeDiff > 0 ? 'bg-coral/10 text-coral' : feeDiff < 0 ? 'bg-teal/10 text-teal' : 'bg-grey-50 text-navy')}>
            {feeDiff > 0
              ? `You'll be charged ${formatEGP(feeDiff)} extra online now.`
              : feeDiff < 0
                ? `You'll receive a refund of ${formatEGP(-feeDiff)} to your card.`
                : 'No extra charge — the change is free.'}{' '}
            {next.hotelAmount !== booking.hotelAmount && `You'll pay ${formatEGP(next.hotelAmount)} at the hotel.`}
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button size="lg" className="w-full" onClick={submit} loading={submitting} disabled={unchanged}>
          {unchanged ? 'Pick a new date or package' : 'Confirm change'}
        </Button>
      </div>
    </div>
  )
}
