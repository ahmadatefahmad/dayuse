'use client'

import { useState, type FormEvent } from 'react'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatEGP } from '@/lib/utils'

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
let stripePromise: Promise<Stripe | null> | null = null
const getStripe = () => (stripePromise ??= publishableKey ? loadStripe(publishableKey) : Promise.resolve(null))

type Props = {
  clientSecret: string
  amount: number
  returnPath: string // where Stripe sends the guest after 3-D Secure redirects
  onPaid: () => void
}

export function StripePayment(props: Props) {
  if (!publishableKey) {
    return <p className="rounded-lg bg-coral/10 p-4 text-sm text-coral">Online payments aren&apos;t set up yet. Add the Stripe keys to enable this step.</p>
  }
  return (
    <Elements
      stripe={getStripe()}
      options={{
        clientSecret: props.clientSecret,
        appearance: { theme: 'stripe', variables: { colorPrimary: '#E8634A', colorText: '#0D1B2A', fontFamily: 'Inter, system-ui, sans-serif', borderRadius: '8px' } },
      }}
    >
      <PaymentForm {...props} />
    </Elements>
  )
}

function PaymentForm({ amount, returnPath, onPaid }: Props) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setPaying(true)
    setError(null)
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}${returnPath}` },
      redirect: 'if_required',
    })
    if (result.error) {
      setError(result.error.message ?? 'Payment failed. Please try another card.')
      setPaying(false)
    } else {
      onPaid()
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" size="lg" className="w-full" loading={paying} disabled={!stripe}>
        <Lock className="h-4 w-4" /> Pay {formatEGP(amount)}
      </Button>
      <p className="text-center text-xs text-grey-500">Payments are processed securely by Stripe. Card details never touch our servers.</p>
    </form>
  )
}
