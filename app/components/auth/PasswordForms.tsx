'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase'
import { PASSWORD_MIN } from '@/lib/validations/account'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/account/reset-password`,
    })
    setLoading(false)
    // Same message whether or not the address has an account, so accounts can't be discovered.
    if (error && !/not found/i.test(error.message)) setError(error.message)
    else setSent(true)
  }

  if (sent) {
    return (
      <div className="space-y-3 text-center">
        <MailCheck className="mx-auto h-12 w-12 text-teal" />
        <p className="text-sm text-grey-500">If an account exists for {email}, a reset link is on its way.</p>
      </div>
    )
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Email" htmlFor="email">
        <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" loading={loading}>
        Send reset link
      </Button>
    </form>
  )
}

// Reached from the reset email: the callback route has already signed the user in.
export function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (password.length < PASSWORD_MIN) return setError(`Use at least ${PASSWORD_MIN} characters`)
    if (password !== confirm) return setError('The passwords don’t match')
    setLoading(true)
    const { error } = await createClient().auth.updateUser({ password })
    setLoading(false)
    if (error) return setError(error.message)
    router.replace('/account/profile?password=updated')
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="New password" htmlFor="password" hint={`At least ${PASSWORD_MIN} characters`}>
        <Input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <Field label="Confirm new password" htmlFor="confirm">
        <Input id="confirm" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" loading={loading}>
        Save new password
      </Button>
    </form>
  )
}
