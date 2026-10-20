import Stripe from 'stripe'

export const isStripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY)

let client: Stripe | null = null

// Returns null until STRIPE_SECRET_KEY is set, so routes can answer 503 instead of crashing.
export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
  return client
}

// Stripe amounts are integers in the smallest unit (piastres for EGP).
export const toPiastres = (egp: number) => Math.round(egp * 100)
export const fromPiastres = (piastres: number) => piastres / 100
export const STRIPE_CURRENCY = 'egp'
