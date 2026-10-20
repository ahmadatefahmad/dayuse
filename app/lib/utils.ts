import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const egp = new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 })
export const formatEGP = (amount: number) => egp.format(amount)

// @db.Date columns are stored as UTC midnight; always convert through these helpers.
export const toDateString = (date: Date) => date.toISOString().slice(0, 10)
export const fromDateString = (value: string) => new Date(`${value}T00:00:00.000Z`)

// "Today" as a YYYY-MM-DD string in Egypt, not UTC, so late-night bookings don't land on yesterday.
const cairoDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' })
export const todayInEgypt = () => cairoDate.format(new Date())
// The Cairo calendar day an instant falls on, e.g. for grouping createdAt timestamps.
export const toCairoDateString = (instant: Date) => cairoDate.format(instant)

// Timestamps shown to the team in Cairo time, whatever time zone the server runs in (Vercel = UTC).
const cairoDateTime = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
const cairoShortDateTime = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
export const formatCairoDateTime = (instant: Date, withYear = true) => (withYear ? cairoDateTime : cairoShortDateTime).format(instant)

// The instant Cairo's day starts (Egypt observes DST, so the UTC offset varies by date).
export function cairoStartOfDay(ymd: string) {
  const zone = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Cairo', timeZoneName: 'longOffset' })
    .formatToParts(new Date(`${ymd}T12:00:00Z`))
    .find((p) => p.type === 'timeZoneName')!.value // "GMT+03:00"
  return new Date(`${ymd}T00:00:00${zone === 'GMT' ? 'Z' : zone.slice(3)}`)
}
export const isDateString = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
