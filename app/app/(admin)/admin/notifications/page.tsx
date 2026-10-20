import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { bookingReference } from '@/lib/booking-format'
import { formatCairoDateTime } from '@/lib/utils'
import { PageHeader } from '@/components/admin/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { buttonClasses } from '@/components/ui/Button'

const CHANNELS = ['email', 'whatsapp', 'sms']
const TYPES = ['booking_confirmed', 'booking_cancelled', 'booking_changed', 'arrival_reminder', 'review_request']
const STATUSES = ['sent', 'failed']
const PREVIEWS = ['booking_confirmed', 'booking_changed', 'booking_cancelled', 'arrival_reminder', 'review_request', 'admin_new']

type Props = { searchParams: { channel?: string; type?: string; status?: string } }

export default async function NotificationsPage({ searchParams }: Props) {
  const pick = (value: string | undefined, allowed: string[]) => (value && allowed.includes(value) ? value : undefined)
  const where: Prisma.NotificationLogWhereInput = {
    channel: pick(searchParams.channel, CHANNELS),
    type: pick(searchParams.type, TYPES),
    status: pick(searchParams.status, STATUSES),
  }
  const [logs, failed24h] = await Promise.all([
    prisma.notificationLog.findMany({ where, orderBy: { sentAt: 'desc' }, take: 200 }),
    prisma.notificationLog.count({ where: { status: 'failed', sentAt: { gte: new Date(Date.now() - 86_400_000) } } }),
  ])

  const select = (name: string, label: string, options: string[]) => (
    <label className="flex flex-col gap-1 text-xs text-grey-500">
      {label}
      <select name={name} defaultValue={searchParams[name as keyof Props['searchParams']] ?? ''} className="h-9 rounded-lg border border-grey-300 bg-white px-2 text-sm text-navy">
        <option value="">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o.replace(/_/g, ' ')}
          </option>
        ))}
      </select>
    </label>
  )

  return (
    <>
      <PageHeader title="Notifications" description={`Last ${logs.length} of up to 200 send attempts${failed24h ? ` · ${failed24h} failed in the last 24h` : ''}.`} />

      <section className="mb-6 rounded-xl border border-grey-100 bg-white p-4">
        <p className="mb-2 text-sm font-medium text-navy">Email previews</p>
        <div className="flex flex-wrap gap-2">
          {PREVIEWS.map((t) => (
            <a key={t} href={`/api/admin/email-preview?template=${t}`} target="_blank" rel="noopener noreferrer" className={buttonClasses('secondary', 'sm')}>
              {t.replace(/_/g, ' ')}
            </a>
          ))}
        </div>
      </section>

      {/* Plain GET form: filters live in the URL and work without JavaScript. */}
      <form className="mb-4 flex flex-wrap items-end gap-3">
        {select('channel', 'Channel', CHANNELS)}
        {select('type', 'Type', TYPES)}
        {select('status', 'Status', STATUSES)}
        <button className={buttonClasses('primary', 'sm')}>Filter</button>
        <Link href="/admin/notifications" className={buttonClasses('ghost', 'sm')}>
          Reset
        </Link>
      </form>

      <div className="overflow-x-auto rounded-xl border border-grey-100 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-grey-100 bg-grey-50 text-xs uppercase tracking-wide text-grey-500">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Channel</th>
              <th className="px-4 py-3 font-medium">Recipient</th>
              <th className="px-4 py-3 font-medium">Booking</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-grey-100">
            {logs.map((l) => (
              <tr key={l.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-3 text-grey-500">{formatCairoDateTime(l.sentAt, false)}</td>
                <td className="px-4 py-3 text-navy">{l.type.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3">{l.channel}</td>
                <td className="max-w-[220px] truncate px-4 py-3" title={l.recipient}>
                  {l.recipient}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {l.bookingId ? (
                    <Link href={`/booking/${l.bookingId}`} className="text-coral hover:underline">
                      {bookingReference(l.bookingId)}
                    </Link>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3">
                  {l.status === 'sent' ? <Badge tone="teal">sent</Badge> : <Badge tone="coral">failed</Badge>}
                  {l.error && <p className="mt-1 max-w-xs text-xs text-grey-500">{l.error}</p>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="px-4 py-12 text-center text-sm text-grey-500">No notifications match these filters.</p>}
      </div>
    </>
  )
}
