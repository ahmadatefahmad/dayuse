'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input, Textarea } from '@/components/ui/Input'
import { apiFetch } from '@/lib/fetcher'
import { cn } from '@/lib/utils'
import { ReviewSchema, type ReviewInput } from '@/lib/validations/account'

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent']

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  return (
    <div className="flex items-center gap-3">
      <div className="-ml-1.5 flex" role="radiogroup" aria-label="Overall rating" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n)}
            className="flex h-11 w-11 items-center justify-center rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-coral"
          >
            <Star className={cn('h-8 w-8 transition-colors', n <= shown ? 'fill-coral text-coral' : 'text-grey-300')} />
          </button>
        ))}
      </div>
      <span className="text-sm text-grey-500">{LABELS[shown]}</span>
    </div>
  )
}

export function ReviewForm({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReviewInput>({ resolver: zodResolver(ReviewSchema), defaultValues: { bookingId, rating: 0, title: '', body: '' } })
  const bodyLength = watch('body')?.trim().length ?? 0

  async function onSubmit(values: ReviewInput) {
    setError(null)
    try {
      await apiFetch('/api/reviews', { method: 'POST', json: ReviewSchema.parse(values) })
      router.push('/account/reviews?submitted=1')
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <Field label="Overall rating" error={errors.rating?.message}>
        <Controller control={control} name="rating" render={({ field }) => <StarPicker value={field.value} onChange={field.onChange} />} />
      </Field>
      <Field label="Title (optional)" htmlFor="title" error={errors.title?.message}>
        <Input id="title" placeholder="Sum up your day in a few words" {...register('title')} />
      </Field>
      <Field label="Your review" htmlFor="body" error={errors.body?.message} hint={`${bodyLength}/50 characters minimum`}>
        <Textarea id="body" rows={6} placeholder="What did you love? The pool, the food, the staff… anything future guests should know?" {...register('body')} />
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" size="lg" loading={isSubmitting}>
        Submit review
      </Button>
      <p className="text-xs text-grey-500">Reviews are checked by our team before being published.</p>
    </form>
  )
}
