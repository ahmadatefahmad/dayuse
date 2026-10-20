'use client'

import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { useBooking, useBookingData, useQuote } from '@/components/booking/BookingProvider'
import { resolvePrice } from '@/lib/pricing'
import { cn, formatEGP } from '@/lib/utils'

export function PackageSelector() {
  const { packages, rules } = useBookingData()
  const date = useBooking((s) => s.date)
  const selectedId = useBooking((s) => s.packageId)
  const selectPackage = useBooking((s) => s.selectPackage)

  return (
    <section id="packages" className="scroll-mt-24 space-y-4">
      <div>
        <h2 className="text-2xl text-navy">Choose your package</h2>
        <p className="mt-1 text-sm text-grey-500">{date ? 'Prices shown for your selected date.' : 'Prices can change by day — pick a date to see the exact price.'}</p>
      </div>
      {packages.map((pkg) => {
        const selected = pkg.id === selectedId
        const price = resolvePrice(pkg, rules, date)
        return (
          <article key={pkg.id} className={cn('rounded-xl border bg-white p-5 transition-colors', selected ? 'border-coral ring-1 ring-coral' : 'border-grey-100')}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-xl text-navy">{pkg.name}</h3>
                <p className="mt-1 text-sm text-grey-500">{pkg.description}</p>
              </div>
              <button
                type="button"
                onClick={() => selectPackage(pkg.id)}
                aria-pressed={selected}
                className={cn(
                  'shrink-0 rounded-lg border-2 px-4 py-1.5 text-sm font-semibold transition-colors',
                  selected ? 'border-coral bg-coral text-white' : 'border-coral text-coral hover:bg-coral/10',
                )}
              >
                {selected ? 'Selected' : 'Select'}
              </button>
            </div>

            {pkg.inclusions.length > 0 && (
              <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
                {pkg.inclusions.map((inc) => (
                  <li key={inc} className="flex items-center gap-2 text-sm text-grey-700">
                    <Check className="h-4 w-4 shrink-0 text-teal" /> {inc}
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-grey-100 pt-4 text-sm text-grey-700">
              <span>
                Adult: <strong className="text-navy">{formatEGP(price.adultPrice)}</strong>
              </span>
              <span>
                Child: <strong className="text-navy">{formatEGP(price.childPrice)}</strong>
              </span>
              <span>
                Infants: <strong className="text-navy">{pkg.infantFree ? 'Free' : formatEGP(price.childPrice)}</strong>
              </span>
            </p>

            {selected && pkg.addOns.length > 0 && <AddOnPicker />}
          </article>
        )
      })}
    </section>
  )
}

// Add-on checkboxes for the selected package. Shared with the booking panel via the store.
export function AddOnPicker({ compact = false }: { compact?: boolean }) {
  const { pkg } = useQuote()
  const addOnIds = useBooking((s) => s.addOnIds)
  const toggleAddOn = useBooking((s) => s.toggleAddOn)
  const [open, setOpen] = useState(compact || addOnIds.length > 0)

  if (pkg.addOns.length === 0) return null
  return (
    <div className={cn(!compact && 'mt-4 rounded-lg bg-grey-50 p-3')}>
      {!compact && (
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-sm font-medium text-navy" aria-expanded={open}>
          Add extras ({pkg.addOns.length})
          <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
        </button>
      )}
      {open && (
        <ul className={cn('space-y-2', !compact && 'mt-3')}>
          {pkg.addOns.map((a) => (
            <li key={a.id}>
              <label className="flex cursor-pointer items-center gap-3 text-sm text-grey-700">
                <input type="checkbox" className="h-4 w-4 accent-coral" checked={addOnIds.includes(a.id)} onChange={() => toggleAddOn(a.id)} />
                <span className="flex-1">{a.name}</span>
                <span className="text-navy">
                  +{formatEGP(a.price)}
                  <span className="text-xs text-grey-500">{a.perPerson ? ' / person' : ''}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
