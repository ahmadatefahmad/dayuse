import { NextResponse, type NextRequest } from 'next/server'
import { handleApiError, requireAdmin } from '@/lib/api'
import { bookingsToCsv, listAdminBookings, parseAdminBookingFilters } from '@/lib/admin/bookings'
import { todayInEgypt } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// GET ?status=&property=&from=&to=&q=&sort=&dir=&page=  (add export=csv for every matching row as CSV)
export async function GET(request: NextRequest) {
  const denied = await requireAdmin()
  if (denied) return denied
  try {
    const filters = parseAdminBookingFilters(request.nextUrl.searchParams)
    if (request.nextUrl.searchParams.get('export') === 'csv') {
      const { rows } = await listAdminBookings(filters, { all: true })
      return new NextResponse(bookingsToCsv(rows), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="dayuse-bookings-${todayInEgypt()}.csv"`,
          'Cache-Control': 'no-store',
        },
      })
    }
    const result = await listAdminBookings(filters)
    return NextResponse.json({ ...result, rows: result.rows.map(({ accessToken: _t, ...b }) => b) })
  } catch (err) {
    return handleApiError(err)
  }
}
