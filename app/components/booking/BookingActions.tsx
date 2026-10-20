'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarPlus, Pencil, XCircle } from 'lucide-react'
import { Button, buttonClasses } from '@/components/ui/Button'
import { apiFetch } from '@/lib/fetcher'

type CalendarEvent = { title: string; date: string; start: string; end: string; location: string; details: string }

const compact = (date: string, time: string) => `${date.replace(/-/g, '')}T${time.replace(':', '')}00`

function downloadIcs(e: CalendarEvent, uid: string) {
  const esc = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n')
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DayUse Egypt//Booking//EN',
    'BEGIN:VEVENT',
    `UID:${uid}@dayuse`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART;TZID=Africa/Cairo:${compact(e.date, e.start)}`,
    `DTEND;TZID=Africa/Cairo:${compact(e.date, e.end)}`,
    `SUMMARY:${esc(e.title)}`,
    `LOCATION:${esc(e.location)}`,
    `DESCRIPTION:${esc(e.details)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: 'dayuse-booking.ics' })
  a.click()
  URL.revokeObjectURL(url)
}

export function AddToCalendar({ event, uid }: { event: CalendarEvent; uid: string }) {
  const google = `https://calendar.google.com/calendar/render?${new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${compact(event.date, event.start)}/${compact(event.date, event.end)}`,
    ctz: 'Africa/Cairo',
    location: event.location,
    details: event.details,
  })}`
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" onClick={() => downloadIcs(event, uid)}>
        <CalendarPlus className="h-4 w-4" /> Add to calendar
      </Button>
      <a href={google} target="_blank" rel="noopener noreferrer" className={buttonClasses('ghost')}>
        Google Calendar
      </a>
    </div>
  )
}

type ManageProps = { bookingId: string; token: string | null; canChange: boolean; canCancel: boolean; compact?: boolean }

export function ManageBooking({ bookingId, token, canChange, canCancel, compact = false }: ManageProps) {
  const router = useRouter()
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function cancel() {
    if (!confirm('Cancel this booking? Your online booking fee will be refunded to your card.')) return
    setCancelling(true)
    setError(null)
    try {
      await apiFetch(`/api/bookings/${bookingId}`, { method: 'PATCH', json: { action: 'cancel', token: token ?? undefined } })
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setCancelling(false)
    }
  }

  if (!canChange && !canCancel) return null
  const tokenQuery = token ? `?t=${encodeURIComponent(token)}` : ''
  const size = compact ? 'sm' : 'md'
  return (
    <div className={compact ? 'contents' : 'space-y-2'}>
      <div className={compact ? 'contents' : 'flex flex-wrap gap-2'}>
        {canChange && (
          <Link href={`/booking/${bookingId}/change${tokenQuery}`} className={buttonClasses('secondary', size)}>
            <Pencil className="h-4 w-4" /> Change date or package
          </Link>
        )}
        {canCancel && (
          <Button variant="danger" size={size} onClick={cancel} loading={cancelling}>
            <XCircle className="h-4 w-4" /> Cancel{compact ? '' : ' booking'}
          </Button>
        )}
      </div>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </div>
  )
}

// While Stripe's webhook hasn't confirmed the payment yet, re-check every few seconds.
export function PendingRefresher() {
  const router = useRouter()
  const [tries, setTries] = useState(0)
  useEffect(() => {
    if (tries >= 20) return
    const t = setTimeout(() => {
      router.refresh()
      setTries((n) => n + 1)
    }, 3000)
    return () => clearTimeout(t)
  }, [tries, router])
  return tries >= 20 ? <p className="text-sm text-grey-500">This is taking longer than usual. We&apos;ll email you as soon as the payment is confirmed.</p> : null
}
