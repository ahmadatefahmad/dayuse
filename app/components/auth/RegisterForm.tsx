'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase'
import { RegisterSchema, type RegisterInput } from '@/lib/validations/account'

export function RegisterForm({ next }: { next: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(RegisterSchema), defaultValues: { fullName: '', email: '', password: '', phone: '' } })

  async function onSubmit(raw: RegisterInput) {
    setError(null)
    const values = RegisterSchema.parse(raw)
    const { data, error } = await createClient().auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        // Stored in user_metadata; the User row is created from it on first visit to the account area.
        data: { full_name: values.fullName, phone: values.phone },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
    if (error) return setError(error.message)
    // With email confirmation on, there's no session until the link is clicked.
    if (data.session) {
      router.replace(next)
      router.refresh()
    } else {
      setSentTo(values.email)
    }
  }

  if (sentTo) {
    return (
      <div className="space-y-3 text-center">
        <MailCheck className="mx-auto h-12 w-12 text-teal" />
        <p className="font-medium text-navy">Check your inbox</p>
        <p className="text-sm text-grey-500">
          We sent a confirmation link to <strong className="text-navy">{sentTo}</strong>. Click it to activate your account. (Check spam if it doesn&apos;t arrive in a minute.)
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
        <Input id="fullName" autoComplete="name" {...register('fullName')} />
      </Field>
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" {...register('email')} />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password?.message} hint="At least 8 characters">
        <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
      </Field>
      <Field label="Mobile (optional)" htmlFor="phone" error={errors.phone?.message} hint="For WhatsApp booking updates">
        <Input id="phone" type="tel" autoComplete="tel" placeholder="+20 10 1234 5678" {...register('phone')} />
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" loading={isSubmitting}>
        Create account
      </Button>
    </form>
  )
}
