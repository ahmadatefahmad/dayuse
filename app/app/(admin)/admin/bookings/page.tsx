import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { ArrowDown, ArrowUp, ChevronsUpDown, Download } from 'lucide-react'
import prisma from '@/lib/prisma'
import { ADMIN_PAGE_SIZE, BOOKING_STATUSES, filtersToQuery, listAdminBookings, parseAdminBookingFilters, type AdminBookingFilters, type AdminSort } from '@/lib/admin/bookings'
import { bookingReference } from '@/lib/booking-format'
import { formatEGP, toDateString, formatCairoDateTime } from '@/lib/utils'
import { BookingStatusPill } from '@/components/admin/BookingStatusPill'
import { PageHeader } from '@/components/admin/PageHeader'
import { buttonClasses } from '@/components/ui/Button'

type Props = { searchParams: Record<string, string | string[] | undefined> }

const inputClass = 'h-9 rounded-lg border border-grey-300 bg-white px-2 text-sm text-navy'

function SortLink({ f, column, children }: { f: AdminBookingFilters; column: AdminSort; children: React.ReactNode }) {
  const active = f.sort === column
  const dir = active && f.dir === 'desc' ? 'asc' : 'desc'
  const Icon = !active ? ChevronsUpDown : f.dir === 'asc' ? ArrowUp : ArrowDown
  return (
    <Link href={`/admin/bookings?${filtersToQuery(f, { sort: column === 'created' ? undefined : column, dir: dir === 'desc' ? undefined : dir, page: undefined })}`} className="inline-flex items-center gap-1 uppercase hover:text-navy">
      {children}
      <Icon className={active ? 'h-3.5 w-3.5 text-coral' : 'h-3.5 w-3.5 text-grey-300'} />
    </Link>
  )
}

export default async function AdminBookingsPage({ searchParams }: Props) {
  const f = parseAdminBookingFilters(searchParams)
  const [{ rows, total, pageCount }, properties] = await Promise.all([
    listAdminBookings(f),
    prisma.property.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ])
  const query = filtersToQuery(f, { page: undefined })
  const firstRow = total ? (f.page - 1) * ADMIN_PAGE_SIZE + 1 : 0

  return (
    <>
      <PageHeader
        title="Bookings"
        description={`${total} booking${total === 1 ? '' : 's'} match${total === 1 ? 'es' : ''} these filters.`}
        actions={
          <a href={`/api/admin/bookings?${query}${query ? '&' : ''}export=csv`} className={buttonClasses('secondary')}>
            <Download className="h-4 w-4" /> Export CSV
          </a>
        }
      />

      {/* Plain GET form: every filter lives in the URL, so views can be bookmarked and shared. */}
      <form className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-grey-100 bg-white p-4">
        <label className="flex flex-col gap-1 text-xs text-grey-500">
          Search
          <input name="q" defaultValue={f.q} placeholder="Guest, email, phone or DU-ref" className={`${inputClass} w-56`} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-grey-500">
          Status
          <select name="status" defaultValue={f.status ?? ''} className={inputClass}>
            <option value="">All</option>
            {BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-grey-500">
          Property
          <select name="property" defaultValue={f.propertyId ?? ''} className={`${inputClass} max-w-[200px]`}>
            <option value="">All</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-grey-500">
          Visit from
          <input type="date" name="from" defaultValue={f.from} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-grey-500">
          to
          <input type="date" name="to" defaultValue={f.to} className={inputClass} />
        </label>
        {f.sort !== 'created' && <input type="hidden" name="sort" value={f.sort} />}
        {f.dir !== 'desc' && <input type="hidden" name="dir" value={f.dir} />}
        <button className={buttonClasses('primary', 'sm')}>Filter</button>
        <Link href="/admin/bookings" className={buttonClasses('ghost', 'sm')}>
          Reset
        </Link>
      </form>

      <div className="overflow-x-auto rounded-xl border border-grey-100 bg-white">
        <table className="w-full whitespace-nowrap text-left text-sm">
          <thead className="border-b border-grey-100 bg-grey-50 text-xs uppercase tracking-wide text-grey-500">
            <tr>
              <th className="px-4 py-3 font-medium">Booking</th>
              <th className="px-4 py-3 font-medium">Guest</th>
              <th className="px-4 py-3 font-medium">Property</th>
              <th className="px-4 py-3 font-medium">
                <SortLink f={f} column="date">
                  Date
                </SortLink>
              </th>
              <th className="px-4 py-3 font-medium">Package</th>
              <th className="px-4 py-3 text-right font-medium">Adults</th>
              <th className="px-4 py-3 text-right font-medium">
                <SortLink f={f} column="total">
                  Total
                </SortLink>
              </th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">
                <SortLink f={f} column="created">
                  Created
                </SortLink>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-grey-100">
            {rows.map((b) => (
              <tr key={b.id} className="hover:bg-grey-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/bookings/${b.id}`} className="font-medium text-coral hover:underline">
                    {bookingReference(b.id)}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/bookings/${b.id}`} className="text-navy hover:underline">
                    {b.guestName}
                  </Link>
                  <p className="text-xs text-grey-500">{b.guestEmail}</p>
                </td>
                <td className="max-w-[180px] truncate px-4 py-3">{b.property.name}</td>
                <td className="px-4 py-3">{format(parseISO(toDateString(b.bookingDate)), 'd MMM yyyy')}</td>
                <td className="max-w-[160px] truncate px-4 py-3">{b.package.name}</td>
                <td className="px-4 py-3 text-right">{b.adults}</td>
                <td className="px-4 py-3 text-right font-medium text-navy">{formatEGP(b.totalPrice)}</td>
                <td className="px-4 py-3">
                  <BookingStatusPill status={b.status} />
                </td>
                <td className="px-4 py-3 text-grey-500">{formatCairoDateTime(b.createdAt, false)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="px-4 py-12 text-center text-sm text-grey-500">No bookings match these filters.</p>}
      </div>

      {total > 0 && (
        <nav className="mt-4 flex items-center justify-between text-sm text-grey-500" aria-label="Pagination">
          <span>
            {firstRow}–{Math.min(f.page * ADMIN_PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex gap-2">
            {f.page > 1 ? (
              <Link href={`/admin/bookings?${filtersToQuery(f, { page: f.page - 1 > 1 ? f.page - 1 : undefined })}`} className={buttonClasses('secondary', 'sm')}>
                Previous
              </Link>
            ) : (
              <span className={buttonClasses('secondary', 'sm', 'pointer-events-none opacity-40')}>Previous</span>
            )}
            <span className="px-2 py-1.5">
              Page {f.page} of {pageCount}
            </span>
            {f.page < pageCount ? (
              <Link href={`/admin/bookings?${filtersToQuery(f, { page: f.page + 1 })}`} className={buttonClasses('secondary', 'sm')}>
                Next
              </Link>
            ) : (
              <span className={buttonClasses('secondary', 'sm', 'pointer-events-none opacity-40')}>Next</span>
            )}
          </div>
        </nav>
      )}
    </>
  )
}
