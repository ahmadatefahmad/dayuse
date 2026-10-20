'use client'

import { useEffect, useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { CalendarDays, X } from 'lucide-react'
import { DateCalendar } from '@/components/booking/DateCalendar'
import { cn } from '@/lib/utils'

interface CalendarPopoverProps {
  value: string // YYYY-MM-DD or ''
  min: string
  onChange: (date: string | null) => void
  className?: string
  placeholder?: string
  inputSize?: 'sm' | 'md' | 'lg'
}

export function CalendarPopover({
  value,
  min,
  onChange,
  className,
  placeholder = 'Any date',
  inputSize = 'md',
}: CalendarPopoverProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onMouse = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onMouse)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouse)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const label = value ? format(parseISO(value), 'EEE, d MMM') : placeholder

  const heights: Record<NonNullable<CalendarPopoverProps['inputSize']>, string> = {
    sm: 'h-9 px-3 text-xs',
    md: 'h-10 px-3 text-sm',
    lg: 'h-12 px-4 text-sm',
  }

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Date: ${label}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          'flex w-full items-center gap-2 rounded-lg border bg-white text-left font-medium transition-colors',
          heights[inputSize],
          open
            ? 'border-coral ring-2 ring-coral/20'
            : 'border-grey-300 hover:border-navy/40',
          value ? 'text-navy' : 'text-grey-500',
        )}
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-grey-400" />
        <span className="flex-1 truncate">{label}</span>
        {value && (
          <span
            role="button"
            aria-label="Clear date"
            tabIndex={0}
            className="rounded-full p-0.5 text-grey-400 hover:bg-grey-100 hover:text-navy"
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onChange(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onChange(null)
            }}
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose a date"
          className="absolute left-0 top-full z-50 mt-2 min-w-[280px] rounded-xl bg-white p-4 shadow-2xl ring-1 ring-grey-100"
        >
          <DateCalendar
            value={value || null}
            onChange={(d) => {
              onChange(d)
              setOpen(false)
            }}
            min={min}
          />
        </div>
      )}
    </div>
  )
}
