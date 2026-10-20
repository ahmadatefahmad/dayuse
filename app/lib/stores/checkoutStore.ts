'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type CheckoutStep = 1 | 2 | 3 | 4

export type GuestDetails = { guestName: string; guestEmail: string; guestPhone: string; specialRequests: string }

// A created booking awaiting payment. `signature` records what it was created from,
// so going back and changing details creates a fresh booking instead of paying for a stale one.
export type PendingBooking = { id: string; token: string; clientSecret: string; amount: number; signature: string }

interface CheckoutState {
  selectionKey: string | null // identifies the property/package/date/guests being checked out
  step: CheckoutStep
  guest: GuestDetails
  couponCode: string | null
  discountAmount: number
  booking: PendingBooking | null
  start: (selectionKey: string) => void
  setStep: (step: CheckoutStep) => void
  setGuest: (guest: GuestDetails) => void
  applyCoupon: (code: string, discount: number) => void
  removeCoupon: () => void
  setBooking: (booking: PendingBooking | null) => void
  finish: () => void
}

const EMPTY_GUEST: GuestDetails = { guestName: '', guestEmail: '', guestPhone: '', specialRequests: '' }

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set, get) => ({
      selectionKey: null,
      step: 1,
      guest: EMPTY_GUEST,
      couponCode: null,
      discountAmount: 0,
      booking: null,
      // Keep guest details across bookings, but restart the steps for a new selection.
      start: (selectionKey) => {
        if (get().selectionKey !== selectionKey) set({ selectionKey, step: 1, couponCode: null, discountAmount: 0, booking: null })
      },
      setStep: (step) => set({ step }),
      setGuest: (guest) => set({ guest }),
      applyCoupon: (couponCode, discountAmount) => set({ couponCode, discountAmount }),
      removeCoupon: () => set({ couponCode: null, discountAmount: 0 }),
      setBooking: (booking) => set({ booking }),
      finish: () => set({ selectionKey: null, step: 1, couponCode: null, discountAmount: 0, booking: null }),
    }),
    {
      name: 'dayuse-checkout',
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: true, // rehydrated in an effect to avoid server/client mismatches
    },
  ),
)
