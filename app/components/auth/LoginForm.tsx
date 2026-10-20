'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'

type Props = { next: string; signedInAs: string | null; notAdmin: boolean }

export function LoginForm({ next, signedInAs, notAdmin }: Props) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await createClient().auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    // The server decides whether this account is an admin; it bounces back here if not.
    router.replace(next)
    router.refresh()
  }

  return (
    <div className="mt-6 space-y-4">
      {notAdmin && (
        <div className="rounded-lg bg-coral/10 p-3 text-sm text-coral">
          {signedInAs ? <>Signed in as <strong>{signedInAs}</strong>, which isn&apos;t an admin account.</> : 'That account isn’t an admin.'}
          {signedInAs && (
            <form action="/auth/signout" method="post" className="mt-2">
              <button className="font-medium underline">Sign out</button>
            </form>
          )}
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <div className="-mt-2 text-right">
          <Link href="/forgot-password" className="text-xs text-grey-500 hover:text-coral">
            Forgot password?
          </Link>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">
          Sign in
        </Button>
      </form>
    </div>
  )
}
