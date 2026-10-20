'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormActions, FormSection } from '@/components/admin/FormSection'
import { ImageUploader } from '@/components/admin/ImageUploader'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { ApiError, apiFetch } from '@/lib/fetcher'
import { slugify } from '@/lib/utils'
import {
  AMENITIES,
  CITIES,
  MAX_IMAGES,
  PROPERTY_TYPE_LABELS,
  PROPERTY_TYPES,
  PropertySchema,
  type PropertyInput,
  type PropertyOutput,
} from '@/lib/validations/property'

const EMPTY: PropertyInput = {
  name: '',
  slug: '',
  type: 'hotel',
  city: CITIES[0],
  area: null,
  stars: null,
  address: '',
  description: '',
  amenities: [],
  images: [],
  coverImage: '',
  active: true,
}

type PropertyFormProps = { propertyId?: string; initial?: PropertyInput }

export function PropertyForm({ propertyId, initial }: PropertyFormProps) {
  const router = useRouter()
  const isEdit = Boolean(propertyId)
  // Keep the slug in sync with the name until the admin edits the slug by hand.
  const slugEdited = useRef(isEdit)
  const [formError, setFormError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({ resolver: zodResolver(PropertySchema), defaultValues: initial ?? EMPTY })

  async function onSubmit(values: PropertyOutput) {
    setFormError(null)
    setSaved(false)
    try {
      if (propertyId) {
        await apiFetch(`/api/admin/properties/${propertyId}`, { method: 'PATCH', json: values })
        reset(values)
        setSaved(true)
        router.refresh()
      } else {
        const created = await apiFetch<{ id: string }>('/api/admin/properties', { method: 'POST', json: values })
        router.push(`/admin/properties/${created.id}/packages`)
        router.refresh()
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setError('slug', { message: 'Another property already uses this slug' })
      else setFormError((e as Error).message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} onChange={() => setSaved(false)} className="space-y-6">
      <FormSection title="Basic info">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Name" htmlFor="name" error={errors.name?.message}>
            <Input
              id="name"
              placeholder="e.g. Steigenberger Aldau Beach"
              {...register('name', {
                onChange: (e) => {
                  if (!slugEdited.current) setValue('slug', slugify(e.target.value))
                },
              })}
            />
          </Field>
          <Field label="Slug" htmlFor="slug" error={errors.slug?.message} hint="Used in the public URL: /property/your-slug">
            <Input id="slug" {...register('slug', { onChange: () => (slugEdited.current = true) })} />
          </Field>
          <Field label="Type" htmlFor="type" error={errors.type?.message}>
            <Select id="type" {...register('type')}>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {PROPERTY_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Stars" htmlFor="stars" error={errors.stars?.message}>
            <Select id="stars" {...register('stars', { setValueAs: (v) => (v === '' || v == null ? null : Number(v)) })}>
              <option value="">Not rated</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {'★'.repeat(n)} ({n})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="City" htmlFor="city" error={errors.city?.message}>
            <Select id="city" {...register('city')}>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Area" htmlFor="area" error={errors.area?.message} hint="Optional, e.g. El Gouna, Naama Bay">
            <Input id="area" {...register('area', { setValueAs: (v) => (typeof v === 'string' && v.trim() ? v.trim() : null) })} />
          </Field>
        </div>
        <Field label="Address" htmlFor="address" error={errors.address?.message}>
          <Input id="address" {...register('address')} />
        </Field>
      </FormSection>

      <FormSection title="Description & amenities">
        <Field label="Description" htmlFor="description" error={errors.description?.message}>
          <Textarea id="description" rows={6} placeholder="What makes a day here special?" {...register('description')} />
        </Field>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-navy">Amenities</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {AMENITIES.map((a) => (
              <label key={a} className="flex items-center gap-2 rounded-lg border border-grey-100 px-3 py-2 text-sm text-grey-700 has-[:checked]:border-teal has-[:checked]:bg-teal/5">
                <input type="checkbox" value={a} className="accent-teal" {...register('amenities')} />
                {a}
              </label>
            ))}
          </div>
        </fieldset>
      </FormSection>

      <FormSection title="Images" description="Photos are what sell a day pass. Use bright, landscape shots.">
        <Field label="Cover image" error={errors.coverImage?.message}>
          <Controller
            control={control}
            name="coverImage"
            render={({ field }) => (
              <ImageUploader max={1} value={field.value ? [field.value] : []} onChange={(urls) => field.onChange(urls[0] ?? '')} />
            )}
          />
        </Field>
        <Field label={`Gallery (up to ${MAX_IMAGES})`} error={errors.images?.message ?? errors.images?.[0]?.message}>
          <Controller
            control={control}
            name="images"
            render={({ field }) => <ImageUploader max={MAX_IMAGES} value={field.value} onChange={field.onChange} />}
          />
        </Field>
      </FormSection>

      <FormSection title="Visibility">
        <Toggle label="Active — visible to guests" {...register('active')} />
      </FormSection>

      <FormActions
        status={
          formError ? (
            <span className="text-red-600">{formError}</span>
          ) : Object.keys(errors).length ? (
            <span className="text-red-600">Fix the highlighted fields.</span>
          ) : saved ? (
            <span className="text-teal">Saved</span>
          ) : isEdit && isDirty ? (
            <span className="text-grey-500">Unsaved changes</span>
          ) : null
        }
      >
        <Button variant="secondary" onClick={() => router.push('/admin/properties')}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isEdit ? 'Save changes' : 'Create property'}
        </Button>
      </FormActions>
    </form>
  )
}
