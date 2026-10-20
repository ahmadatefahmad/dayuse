'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input, Select } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { ApiError, apiFetch } from '@/lib/fetcher'
import { todayInEgypt } from '@/lib/utils'
import { CouponSchema, suggestCouponCode, type CouponInput } from '@/lib/validations/coupon'

const num = (v: unknown) => (v === '' || v == null ? null : Number(v))

export function NewCouponButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New coupon
      </Button>
      {open && <CouponModal onClose={() => setOpen(false)} />}
    </>
  )
}

function CouponModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setValue,
    setError: setFieldError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CouponInput>({
    resolver: zodResolver(CouponSchema),
    defaultValues: { code: suggestCouponCode(), type: 'percent', value: 10, minBookingTotal: null, maxUses: null, expiresAt: '', active: true },
  })
  const type = watch('type')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function onSubmit(values: CouponInput) {
    setError(null)
    try {
      await apiFetch('/api/admin/coupons', { method: 'POST', json: values })
      router.refresh()
      onClose()
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setFieldError('code', { message: e.message })
      else setError((e as Error).message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy/50 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="coupon-title">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-lg space-y-5 rounded-xl bg-white p-6 shadow-xl" noValidate>
        <div className="flex items-center justify-between">
          <h2 id="coupon-title" className="text-xl text-navy">
            New coupon
          </h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5 text-grey-500" />
          </button>
        </div>

        <Field label="Code" htmlFor="code" error={errors.code?.message} hint="Guests type this at checkout (not case-sensitive)">
          <div className="flex gap-2">
            <Input id="code" className="uppercase" {...register('code')} />
            <Button variant="secondary" onClick={() => setValue('code', suggestCouponCode(), { shouldValidate: true })} aria-label="Suggest a random code">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Type" htmlFor="type">
            <Select id="type" {...register('type')}>
              <option value="percent">Percent</option>
              <option value="fixed">Fixed amount</option>
            </Select>
          </Field>
          <Field label={type === 'percent' ? 'Value (%)' : 'Value (EGP)'} htmlFor="value" error={errors.value?.message}>
            <Input id="value" type="number" min={1} step="any" {...register('value', { valueAsNumber: true })} />
          </Field>
          <Field label="Min booking total (EGP)" htmlFor="minBookingTotal" error={errors.minBookingTotal?.message} hint="Optional">
            <Input id="minBookingTotal" type="number" min={0} {...register('minBookingTotal', { setValueAs: num })} />
          </Field>
          <Field label="Max uses" htmlFor="maxUses" error={errors.maxUses?.message} hint="Empty = unlimited">
            <Input id="maxUses" type="number" min={1} {...register('maxUses', { setValueAs: num })} />
          </Field>
          <Field label="Expires on" htmlFor="expiresAt" error={errors.expiresAt?.message} hint="Optional; valid through this day">
            <Input id="expiresAt" type="date" min={todayInEgypt()} {...register('expiresAt')} />
          </Field>
          <div className="flex items-end pb-2">
            <Toggle label="Active" {...register('active')} />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Create coupon
          </Button>
        </div>
      </form>
    </div>
  )
}

export function CouponActiveToggle({ id, active }: { id: string; active: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  async function toggle() {
    setBusy(true)
    try {
      await apiFetch(`/api/admin/coupons/${id}`, { method: 'PATCH', json: { active: !active } })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }
  return (
    <Button variant={active ? 'ghost' : 'secondary'} size="sm" onClick={toggle} loading={busy}>
      {active ? 'Deactivate' : 'Activate'}
    </Button>
  )
}
