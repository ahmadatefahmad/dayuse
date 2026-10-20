'use client'

import { useMemo, useState } from 'react'
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, parseISO, startOfMonth, startOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type DateCalendarProps = {
  value: string | null
  onChange: (date: string) => void
  min: string // YYYY-MM-DD, first bookable day
  max?: string // YYYY-MM-DD, last bookable day (open-ended if omitted)
  blocked?: Set<string> // blackout dates: shown but not selectable (README rule 5)
}

const WEEK_STARTS_ON = 6 // Saturday, as in Egypt
const NO_DATES = new Set<string>()

export function DateCalendar({ value, onChange, min, max, blocked = NO_DATES }: DateCalendarProps) {
  const [month, setMonth] = useState(() => startOfMonth(parseISO(value ?? min)))
  const minMonth = startOfMonth(parseISO(min))
  const maxMonth = max ? startOfMonth(parseISO(max)) : null

  const days = useMemo(
    () => eachDayOfInterval({ start: startOfWeek(month, { weekStartsOn: WEEK_STARTS_ON }), end: endOfWeek(endOfMonth(month), { weekStartsOn: WEEK_STARTS_ON }) }),
    [month],
  )
  const weekdays = days.slice(0, 7).map((d) => format(d, 'EEEEEE'))

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth((m) => addMonths(m, -1))}
          disabled={month <= minMonth}
          className="rounded-full p-1.5 text-navy hover:bg-grey-100 disabled:opacity-30"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold text-navy" aria-live="polite">
          {format(month, 'MMMM yyyy')}
        </p>
        <button
          type="button"
          onClick={() => setMonth((m) => addMonths(m, 1))}
          disabled={maxMonth !== null && month >= maxMonth}
          className="rounded-full p-1.5 text-navy hover:bg-grey-100 disabled:opacity-30"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {weekdays.map((d) => (
          <span key={d} className="py-1 font-medium text-grey-500">
            {d}
          </span>
        ))}
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          if (!isSameMonth(day, month)) return <span key={key} />
          const isBlocked = blocked.has(key)
          const disabled = key < min || (max !== undefined && key > max) || isBlocked
          const selected = key === value
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onChange(key)}
              title={isBlocked ? 'Closed on this date' : undefined}
              aria-label={`${format(day, 'EEEE d MMMM')}${isBlocked ? ', closed' : ''}`}
              aria-pressed={selected}
              className={cn(
                'aspect-square rounded-full text-sm transition-colors',
                selected ? 'bg-coral font-semibold text-white' : 'text-navy hover:bg-coral/10',
                disabled && 'cursor-not-allowed text-grey-300 hover:bg-transparent',
                isBlocked && 'line-through',
              )}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
