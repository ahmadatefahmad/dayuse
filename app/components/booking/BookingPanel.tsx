'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { addDays, format, parseISO } from 'date-fns'
import { CalendarDays, ChevronDown, Minus, Plus } from 'lucide-react'
import { guestLimits, useBooking, useBookingData, useQuote, type GuestKey } from '@/components/booking/BookingProvider'
import { DateCalendar } from '@/components/booking/DateCalendar'
import { AddOnPicker } from '@/components/booking/PackageSelector'
import { PriceBreakdown } from '@/components/booking/PriceBreakdown'
import { buttonClasses } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { cn, formatEGP, todayInEgypt } from '@/lib/utils'

const BOOKING_HORIZON_DAYS = 365

const UNAVAILABLE_MESSAGES: Record<string, string> = {
  blackout: 'Closed to day guests on this date. Please pick another day.',
  full: 'Fully booked for your party on this date.',
  not_configured: 'This property isn’t taking bookings yet.',
  past: 'That date has passed. Please pick another day.',
}

export function BookingPanel() {
  const data = useBookingData()
  const date = useBooking((s) => s.date)
  const setDate = useBooking((s) => s.setDate)
  const packageId = useBooking((s) => s.packageId)
  const selectPackage = useBooking((s) => s.selectPackage)
  const availability = useBooking((s) => s.availability)
  const checking = useBooking((s) => s.checking)
  const adults = useBooking((s) => s.adults)
  const children = useBooking((s) => s.children)
  const infants = useBooking((s) => s.infants)
  const addOnIds = useBooking((s) => s.addOnIds)
  const { pkg, price, addOns, quote } = useQuote()
  const [calendarOpen, setCalendarOpen] = useState(!date)

  const min = todayInEgypt()
  const max = format(addDays(parseISO(min), BOOKING_HORIZON_DAYS), 'yyyy-MM-dd')
  const blocked = useMemo(() => new Set(data.blackoutDates), [data.blackoutDates])

  const canBook = data.bookable && Boolean(date) && !checking && availability?.available === true
  const checkoutHref = useMemo(() => {
    const params = new URLSearchParams({ property: data.propertyId, package: packageId, date: date ?? '', adults: String(adults), children: String(children), infants: String(infants) })
    if (addOnIds.length) params.set('addOns', addOnIds.join(','))
    return `/checkout?${params}`
  }, [data.propertyId, packageId, date, adults, children, infants, addOnIds])

  return (
    <div id="book" className="scroll-mt-24 rounded-xl border border-grey-100 bg-white p-5 shadow-lg">
      <p className="text-sm text-grey-500">
        From <span className="font-playfair text-2xl text-navy">{formatEGP(price.adultPrice)}</span> / adult
      </p>

      {!data.bookable ? (
        <p className="mt-4 rounded-lg bg-sand/30 p-3 text-sm text-navy">{UNAVAILABLE_MESSAGES.not_configured} Check back soon.</p>
      ) : (
        <div className="mt-5 space-y-5">
          <div>
            <button
              type="button"
              onClick={() => setCalendarOpen((o) => !o)}
              className="flex w-full items-center gap-3 rounded-lg border border-grey-300 px-3 py-2.5 text-left hover:border-navy"
              aria-expanded={calendarOpen}
            >
              <CalendarDays className="h-5 w-5 text-coral" />
              <span className="flex-1">
                <span className="block text-xs text-grey-500">Date</span>
                <span className="text-sm font-medium text-navy">{date ? format(parseISO(date), 'EEE d MMM yyyy') : 'Select a date'}</span>
              </span>
              <ChevronDown className={cn('h-4 w-4 text-grey-500 transition-transform', calendarOpen && 'rotate-180')} />
            </button>
            {calendarOpen && (
              <div className="mt-3 rounded-lg border border-grey-100 p-3">
                <DateCalendar
                  value={date}
                  min={min}
                  max={max}
                  blocked={blocked}
                  onChange={(d) => {
                    setDate(d)
                    setCalendarOpen(false)
                  }}
                />
              </div>
            )}
            <AvailabilityNote />
          </div>

          {data.packages.length > 1 && (
            <label className="block">
              <span className="mb-1.5 block text-xs text-grey-500">Package</span>
              <Select value={packageId} onChange={(e) => selectPackage(e.target.value)}>
                {data.packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </label>
          )}

          <div className="space-y-3">
            <GuestStepper k="adults" label="Adults" />
            <GuestStepper k="children" label="Children" />
            <GuestStepper k="infants" label="Infants" hint={pkg.infantFree ? 'Free' : undefined} />
          </div>

          {pkg.addOns.length > 0 && (
            <div>
              <p className="mb-2 text-xs text-grey-500">Extras</p>
              <AddOnPicker compact />
            </div>
          )}

          <PriceBreakdown
            quote={quote}
            packageName={pkg.name}
            guests={{ adults, children, infants }}
            infantFree={pkg.infantFree}
            addOns={addOns}
            className="border-t border-grey-100 pt-5"
          />

          {canBook ? (
            <Link href={checkoutHref} className={buttonClasses('primary', 'lg', 'w-full')}>
              Book now · pay {formatEGP(quote.platformFee)} today
            </Link>
          ) : (
            <button type="button" disabled className={buttonClasses('primary', 'lg', 'w-full')}>
              {!date ? 'Select a date to book' : checking ? 'Checking availability…' : 'Not available'}
            </button>
          )}
          <p className="text-center text-xs text-grey-500">You won&apos;t be charged until the next step.</p>
        </div>
      )}
    </div>
  )
}

function AvailabilityNote() {
  const date = useBooking((s) => s.date)
  const checking = useBooking((s) => s.checking)
  const availability = useBooking((s) => s.availability)
  if (!date) return null
  if (checking)
    return (
      <p className="mt-2 flex items-center gap-2 text-xs text-grey-500">
        <Spinner className="h-3.5 w-3.5" label="Checking availability" /> Checking availability…
      </p>
    )
  if (!availability) return <p className="mt-2 text-xs text-red-600">Couldn&apos;t check availability. Please try again.</p>
  if (!availability.available) return <p className="mt-2 text-xs text-red-600">{UNAVAILABLE_MESSAGES[availability.reason ?? ''] ?? 'Not available on this date.'}</p>
  if (availability.spotsLeft !== null && availability.spotsLeft <= 10)
    return <p className="mt-2 text-xs font-medium text-coral">Only {availability.spotsLeft} spots left on this day</p>
  return <p className="mt-2 text-xs font-medium text-teal">Available</p>
}

function GuestStepper({ k, label, hint }: { k: GuestKey; label: string; hint?: string }) {
  const value = useBooking((s) => s[k])
  const setGuests = useBooking((s) => s.setGuests)
  const availability = useBooking((s) => s.availability)
  const { pkg } = useQuote()
  const { min, max } = guestLimits(pkg, availability)[k]

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-navy">
        {label} {hint && <span className="text-xs text-teal">· {hint}</span>}
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setGuests(k, value - 1)}
          disabled={value <= min}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-grey-300 text-navy hover:border-navy disabled:opacity-30"
          aria-label={`Fewer ${label.toLowerCase()}`}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-5 text-center text-sm font-semibold text-navy" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          onClick={() => setGuests(k, value + 1)}
          disabled={value >= max}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-grey-300 text-navy hover:border-navy disabled:opacity-30"
          aria-label={`More ${label.toLowerCase()}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
