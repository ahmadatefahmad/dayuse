'use client'

import { useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { TagInput } from '@/components/admin/TagInput'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input, Textarea } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { apiFetch } from '@/lib/fetcher'
import { PackageSchema, type PackageInput, type PackageOutput } from '@/lib/validations/property'

const optionalNumber = (v: unknown) => (v === '' || v == null ? null : Number(v))

const EMPTY: Partial<PackageInput> = {
  name: '',
  description: '',
  inclusions: [],
  infantFree: true,
  maxAdults: null,
  maxChildren: null,
  active: true,
  sortOrder: 0,
  addOns: [],
}

type PackageFormProps = {
  propertyId: string
  packageId?: string
  initial?: PackageInput
  onSaved: () => void
  onCancel: () => void
}

export function PackageForm({ propertyId, packageId, initial, onSaved, onCancel }: PackageFormProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PackageInput, unknown, PackageOutput>({ resolver: zodResolver(PackageSchema), defaultValues: initial ?? EMPTY })
  // keyName avoids clobbering the add-on's own database `id` field.
  const addOns = useFieldArray({ control, name: 'addOns', keyName: '_key' })

  async function onSubmit(values: PackageOutput) {
    setFormError(null)
    try {
      const base = `/api/admin/properties/${propertyId}/packages`
      if (packageId) await apiFetch(`${base}/${packageId}`, { method: 'PATCH', json: values })
      else await apiFetch(base, { method: 'POST', json: values })
      onSaved()
    } catch (e) {
      setFormError((e as Error).message)
    }
  }

  const id = (name: string) => `${packageId ?? 'new'}-${name}`

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-xl border border-coral/30 bg-white p-5 md:p-6">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Package name" htmlFor={id('name')} error={errors.name?.message}>
          <Input id={id('name')} placeholder="e.g. Pool Day" {...register('name')} />
        </Field>
        <Field label="Display order" htmlFor={id('sortOrder')} error={errors.sortOrder?.message} hint="Lower numbers show first">
          <Input id={id('sortOrder')} type="number" {...register('sortOrder', { valueAsNumber: true })} />
        </Field>
      </div>

      <Field label="Description" htmlFor={id('description')} error={errors.description?.message}>
        <Textarea id={id('description')} rows={3} className="min-h-[80px]" {...register('description')} />
      </Field>

      <Field label="Inclusions" htmlFor={id('inclusions')} hint="Press Enter after each item" error={errors.inclusions?.message}>
        <Controller
          control={control}
          name="inclusions"
          render={({ field }) => (
            <TagInput id={id('inclusions')} value={field.value} onChange={field.onChange} placeholder="Pool access, Welcome drink, Towel…" />
          )}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Adult price (EGP)" htmlFor={id('adultPrice')} error={errors.adultPrice?.message}>
          <Input id={id('adultPrice')} type="number" min={0} step="any" {...register('adultPrice', { valueAsNumber: true })} />
        </Field>
        <Field label="Child price (EGP)" htmlFor={id('childPrice')} error={errors.childPrice?.message}>
          <Input id={id('childPrice')} type="number" min={0} step="any" {...register('childPrice', { valueAsNumber: true })} />
        </Field>
        <Field label="Max adults" htmlFor={id('maxAdults')} error={errors.maxAdults?.message} hint="Per booking, optional">
          <Input id={id('maxAdults')} type="number" min={1} {...register('maxAdults', { setValueAs: optionalNumber })} />
        </Field>
        <Field label="Max children" htmlFor={id('maxChildren')} error={errors.maxChildren?.message} hint="Per booking, optional">
          <Input id={id('maxChildren')} type="number" min={1} {...register('maxChildren', { setValueAs: optionalNumber })} />
        </Field>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-navy">
          <input type="checkbox" className="accent-teal" {...register('infantFree')} />
          Infants go free
        </label>
        <Toggle label="Active" {...register('active')} />
      </div>

      <div className="space-y-3 border-t border-grey-100 pt-5">
        <div className="flex items-center justify-between">
          <h3 className="font-inter text-sm font-semibold text-navy">Add-ons</h3>
          <Button variant="secondary" size="sm" onClick={() => addOns.append({ name: '', price: 0, perPerson: true, active: true })}>
            <Plus className="h-3.5 w-3.5" /> Add-on
          </Button>
        </div>
        {addOns.fields.length === 0 && <p className="text-sm text-grey-500">No add-ons. Extras like lunch, massage or cabana go here.</p>}
        {addOns.fields.map((field, i) => (
          <div key={field._key} className="grid items-start gap-3 rounded-lg bg-grey-50 p-3 sm:grid-cols-[1fr_140px_auto_auto_auto] sm:items-center">
            <div>
              <Input placeholder="Add-on name" aria-label="Add-on name" {...register(`addOns.${i}.name`)} />
              {errors.addOns?.[i]?.name && <p className="mt-1 text-xs text-red-600">{errors.addOns[i]?.name?.message}</p>}
            </div>
            <div>
              <Input type="number" min={0} step="any" placeholder="Price" aria-label="Add-on price (EGP)" {...register(`addOns.${i}.price`, { valueAsNumber: true })} />
              {errors.addOns?.[i]?.price && <p className="mt-1 text-xs text-red-600">{errors.addOns[i]?.price?.message}</p>}
            </div>
            <label className="flex items-center gap-2 text-sm text-grey-700">
              <input type="checkbox" className="accent-teal" {...register(`addOns.${i}.perPerson`)} />
              Per person
            </label>
            <label className="flex items-center gap-2 text-sm text-grey-700">
              <input type="checkbox" className="accent-teal" {...register(`addOns.${i}.active`)} />
              Active
            </label>
            <Button variant="ghost" size="sm" onClick={() => addOns.remove(i)} aria-label="Remove add-on">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-grey-100 pt-5">
        {formError && <p className="mr-auto text-sm text-red-600">{formError}</p>}
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {packageId ? 'Save package' : 'Create package'}
        </Button>
      </div>
    </form>
  )
}
