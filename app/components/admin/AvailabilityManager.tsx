'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { Plus, Trash2 } from 'lucide-react'
import { FormActions, FormSection } from '@/components/admin/FormSection'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { apiFetch } from '@/lib/fetcher'
import { fromDateString, todayInEgypt } from '@/lib/utils'
import { AvailabilitySchema, type AvailabilityInput, type AvailabilityOutput } from '@/lib/validations/property'

type Props = { propertyId: string; initial: Partial<AvailabilityInput>; configured: boolean }

export function AvailabilityManager({ propertyId, initial, configured }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [newDate, setNewDate] = useState('')
  const [newReason, setNewReason] = useState('')

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AvailabilityInput, unknown, AvailabilityOutput>({ resolver: zodResolver(AvailabilitySchema), defaultValues: initial })
  const blackouts = useFieldArray({ control, name: 'blackoutDates', keyName: '_key' })

  function addBlackout() {
    if (!newDate) return setStatus({ tone: 'error', text: 'Pick a date to block.' })
    if (blackouts.fields.some((f) => f.date === newDate)) return setStatus({ tone: 'error', text: 'That date is already blocked.' })
    blackouts.append({ date: newDate, reason: newReason.trim() || null })
    setNewDate('')
    setNewReason('')
    setStatus(null)
  }

  async function onSubmit(values: AvailabilityOutput) {
    setStatus(null)
    try {
      await apiFetch(`/api/admin/properties/${propertyId}/availability`, { method: 'POST', json: values })
      reset(values)
      setStatus({ tone: 'ok', text: 'Availability saved' })
      router.refresh()
    } catch (e) {
      setStatus({ tone: 'error', text: (e as Error).message })
    }
  }

  // Show blackout dates chronologically while keeping each row's field-array index for remove().
  const sorted = blackouts.fields.map((field, index) => ({ field, index })).sort((a, b) => a.field.date.localeCompare(b.field.date))

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {!configured && (
        <p className="rounded-lg bg-coral/10 p-3 text-sm text-coral">No availability saved yet — guests can&apos;t book this property until you save it.</p>
      )}

      <FormSection title="Opening hours & capacity" description="Bookings are blocked once confirmed guests for a date reach these limits.">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Opens" htmlFor="startTime" error={errors.startTime?.message}>
            <Input id="startTime" type="time" {...register('startTime')} />
          </Field>
          <Field label="Closes" htmlFor="endTime" error={errors.endTime?.message}>
            <Input id="endTime" type="time" {...register('endTime')} />
          </Field>
          <Field label="Max adults per day" htmlFor="maxCapacityAdults" error={errors.maxCapacityAdults?.message}>
            <Input id="maxCapacityAdults" type="number" min={1} {...register('maxCapacityAdults', { valueAsNumber: true })} />
          </Field>
          <Field label="Max children per day" htmlFor="maxCapacityChildren" error={errors.maxCapacityChildren?.message}>
            <Input id="maxCapacityChildren" type="number" min={0} {...register('maxCapacityChildren', { valueAsNumber: true })} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Blackout dates" description="Days the property is closed to day-use guests, whatever the capacity.">
        {sorted.length > 0 ? (
          <ul className="divide-y divide-grey-100 rounded-lg border border-grey-100">
            {sorted.map(({ field, index }) => (
              <li key={field._key} className="grid items-center gap-3 px-3 py-2 sm:grid-cols-[180px_1fr_auto]">
                <span className="font-medium text-navy">{format(fromDateString(field.date), 'EEE d MMM yyyy')}</span>
                <Input placeholder="Reason (optional)" aria-label="Reason" {...register(`blackoutDates.${index}.reason`)} />
                <Button variant="ghost" size="sm" onClick={() => blackouts.remove(index)} aria-label="Remove blackout date">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-grey-500">No blackout dates.</p>
        )}
        {errors.blackoutDates?.root?.message && <p className="text-xs text-red-600">{errors.blackoutDates.root.message}</p>}
        <div className="grid gap-3 sm:grid-cols-[180px_1fr_auto]">
          <Input type="date" min={todayInEgypt()} value={newDate} onChange={(e) => setNewDate(e.target.value)} aria-label="Blackout date" />
          <Input
            placeholder="Reason, e.g. Private event"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addBlackout()
              }
            }}
            aria-label="Blackout reason"
          />
          <Button variant="secondary" onClick={addBlackout}>
            <Plus className="h-4 w-4" /> Block date
          </Button>
        </div>
      </FormSection>

      <FormActions
        status={
          status ? (
            <span className={status.tone === 'ok' ? 'text-teal' : 'text-red-600'}>{status.text}</span>
          ) : isDirty ? (
            <span className="text-grey-500">Unsaved changes</span>
          ) : null
        }
      >
        <Button type="submit" loading={isSubmitting}>
          Save availability
        </Button>
      </FormActions>
    </form>
  )
}
