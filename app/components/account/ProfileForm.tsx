'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormSection } from '@/components/admin/FormSection'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { apiFetch } from '@/lib/fetcher'
import { ProfileSchema, type ProfileInput } from '@/lib/validations/account'

export function ProfileForm({ email, name, phone }: { email: string; name: string; phone: string }) {
  const router = useRouter()
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileInput>({ resolver: zodResolver(ProfileSchema), defaultValues: { name, phone, currentPassword: '', newPassword: '' } })

  async function onSubmit(values: ProfileInput) {
    setStatus(null)
    try {
      const saved = await apiFetch<{ name: string; phone: string | null; passwordChanged: boolean }>('/api/account/profile', { method: 'PATCH', json: values })
      reset({ name: saved.name, phone: saved.phone ?? '', currentPassword: '', newPassword: '' })
      setStatus({ ok: true, text: saved.passwordChanged ? 'Profile and password updated.' : 'Profile updated.' })
      router.refresh()
    } catch (e) {
      setStatus({ ok: false, text: (e as Error).message })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6" noValidate>
      <FormSection title="Your details" description="Used to pre-fill checkout. Your bookings keep the details they were made with.">
        <Field label="Email" htmlFor="email" hint="Contact us to change your sign-in email.">
          <Input id="email" value={email} disabled readOnly />
        </Field>
        <Field label="Full name" htmlFor="name" error={errors.name?.message}>
          <Input id="name" autoComplete="name" {...register('name')} />
        </Field>
        <Field label="Mobile (optional)" htmlFor="phone" error={errors.phone?.message} hint="Egyptian mobile for WhatsApp updates">
          <Input id="phone" type="tel" autoComplete="tel" placeholder="+20 10 1234 5678" {...register('phone')} />
        </Field>
      </FormSection>

      <FormSection title="Change password" description="Leave blank to keep your current password.">
        <Field label="Current password" htmlFor="currentPassword" error={errors.currentPassword?.message}>
          <Input id="currentPassword" type="password" autoComplete="current-password" {...register('currentPassword')} />
        </Field>
        <Field label="New password" htmlFor="newPassword" error={errors.newPassword?.message} hint="At least 8 characters">
          <Input id="newPassword" type="password" autoComplete="new-password" {...register('newPassword')} />
        </Field>
      </FormSection>

      <div className="flex items-center gap-4">
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          Save changes
        </Button>
        {status && <p className={status.ok ? 'text-sm text-teal' : 'text-sm text-red-600'}>{status.text}</p>}
      </div>
    </form>
  )
}
