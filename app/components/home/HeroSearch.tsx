'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CalendarPopover } from '@/components/ui/CalendarPopover'
import { todayInEgypt } from '@/lib/utils'
import { CITIES, citySlug } from '@/lib/validations/property'

export function HeroSearch() {
  const router = useRouter()
  const [city, setCity] = useState('')
  const [date, setDate] = useState('')

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (city) params.set('city', city)
    if (date) params.set('date', date)
    router.push(`/search${params.size ? `?${params}` : ''}`)
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid w-full max-w-3xl gap-2 rounded-xl bg-white p-2 shadow-2xl sm:grid-cols-[1fr_1fr_auto]"
    >
      <label className="relative block">
        <span className="sr-only">City</span>
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grey-400" />
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="h-12 w-full appearance-none rounded-lg border border-grey-100 bg-white pl-9 pr-3 text-sm font-medium text-navy focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20"
        >
          <option value="">Any city</option>
          {CITIES.map((c) => (
            <option key={c} value={citySlug(c)}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <CalendarPopover
        value={date}
        min={todayInEgypt()}
        onChange={(d) => setDate(d ?? '')}
        inputSize="lg"
        placeholder="Any date"
        className="block"
      />

      <Button type="submit" size="lg">
        <Search className="h-4 w-4" />
        Search
      </Button>
    </form>
  )
}
