'use client'

import { createContext, useContext, useMemo, useRef, type ReactNode } from 'react'
import { useStore } from 'zustand'
import { createStore, type StoreApi } from 'zustand/vanilla'
import { calculateQuote, GUEST_LIMITS, resolvePrice, type PriceRule } from '@/lib/pricing'

export type BookingAddOn = { id: string; name: string; price: number; perPerson: boolean }
export type BookingPackage = {
  id: string
  name: string
  description: string
  inclusions: string[]
  adultPrice: number
  childPrice: number
  infantFree: boolean
  maxAdults: number | null
  maxChildren: number | null
  addOns: BookingAddOn[]
}
export type AvailabilityResult = { available: boolean; isBlackout: boolean; spotsLeft: number | null; reason?: string }

export type BookingData = {
  propertyId: string
  packages: BookingPackage[]
  rules: PriceRule[]
  blackoutDates: string[]
  bookable: boolean // has an availability window configured
}

export type GuestKey = 'adults' | 'children' | 'infants'

type BookingState = {
  date: string | null
  packageId: string
  adults: number
  children: number
  infants: number
  addOnIds: string[]
  availability: AvailabilityResult | null
  checking: boolean
  setDate: (date: string) => void
  selectPackage: (id: string) => void
  setGuests: (key: GuestKey, value: number) => void
  toggleAddOn: (id: string) => void
}


// Guest-count limits for a package, also capped by remaining capacity for the date.
export function guestLimits(pkg: BookingPackage, availability: AvailabilityResult | null) {
  const capacity = availability?.spotsLeft ?? Infinity
  return {
    adults: { min: 1, max: Math.max(1, Math.min(pkg.maxAdults ?? GUEST_LIMITS.adults, capacity)) },
    children: { min: 0, max: pkg.maxChildren ?? GUEST_LIMITS.children },
    infants: { min: 0, max: GUEST_LIMITS.infants },
  }
}

function createBookingStore(data: BookingData) {
  let request = 0
  return createStore<BookingState>()((set, get) => ({
    date: null,
    packageId: data.packages[0]?.id ?? '',
    adults: 2,
    children: 0,
    infants: 0,
    addOnIds: [],
    availability: null,
    checking: false,

    async setDate(date) {
      const id = ++request
      set({ date, availability: null, checking: true })
      try {
        const res = await fetch(`/api/properties/${data.propertyId}/availability?date=${date}`)
        const availability: AvailabilityResult = await res.json()
        if (id !== request) return // a newer date was picked meanwhile
        // Shrink the party if fewer spots are left than currently selected.
        const adults = availability.spotsLeft != null ? Math.max(1, Math.min(get().adults, availability.spotsLeft)) : get().adults
        set({ availability, checking: false, adults })
      } catch {
        if (id === request) set({ availability: null, checking: false })
      }
    },

    selectPackage(packageId) {
      const pkg = data.packages.find((p) => p.id === packageId)
      if (!pkg) return
      const limits = guestLimits(pkg, get().availability)
      set((s) => ({
        packageId,
        addOnIds: [], // add-ons belong to a package
        adults: Math.min(s.adults, limits.adults.max),
        children: Math.min(s.children, limits.children.max),
      }))
    },

    setGuests(key, value) {
      const pkg = data.packages.find((p) => p.id === get().packageId)
      if (!pkg) return
      const { min, max } = guestLimits(pkg, get().availability)[key]
      set({ [key]: Math.min(Math.max(value, min), max) } as Pick<BookingState, GuestKey>)
    },

    toggleAddOn(id) {
      set((s) => ({ addOnIds: s.addOnIds.includes(id) ? s.addOnIds.filter((a) => a !== id) : [...s.addOnIds, id] }))
    },
  }))
}

type Ctx = { store: StoreApi<BookingState>; data: BookingData }
const BookingContext = createContext<Ctx | null>(null)

export function BookingProvider({ data, children }: { data: BookingData; children: ReactNode }) {
  const store = useRef<StoreApi<BookingState>>()
  if (!store.current) store.current = createBookingStore(data)
  return <BookingContext.Provider value={{ store: store.current, data }}>{children}</BookingContext.Provider>
}

function useCtx() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('Booking components must be inside <BookingProvider>')
  return ctx
}

export function useBooking<T>(selector: (s: BookingState) => T) {
  return useStore(useCtx().store, selector)
}

export const useBookingData = () => useCtx().data

// Prices for the selected package on the selected date, plus the full quote.
export function useQuote() {
  const { packages, rules } = useBookingData()
  const date = useBooking((s) => s.date)
  const packageId = useBooking((s) => s.packageId)
  const adults = useBooking((s) => s.adults)
  const children = useBooking((s) => s.children)
  const infants = useBooking((s) => s.infants)
  const addOnIds = useBooking((s) => s.addOnIds)

  return useMemo(() => {
    const pkg = packages.find((p) => p.id === packageId) ?? packages[0]
    const price = resolvePrice(pkg, rules, date)
    const addOns = pkg.addOns.filter((a) => addOnIds.includes(a.id))
    const quote = calculateQuote({ ...price, infantFree: pkg.infantFree, adults, children, infants, addOns })
    return { pkg, price, addOns, quote }
  }, [packages, rules, date, packageId, adults, children, infants, addOnIds])
}
