import { NextResponse } from 'next/server'
import { handleApiError, requireAdmin } from '@/lib/api'
import { getDashboardStats } from '@/lib/admin/stats'

export const dynamic = 'force-dynamic'

// GET -> dashboard KPIs (same numbers the dashboard page renders).
export async function GET() {
  const denied = await requireAdmin()
  if (denied) return denied
  try {
    const { recent, ...stats } = await getDashboardStats()
    return NextResponse.json({ ...stats, recent: recent.map(({ accessToken: _t, ...b }) => b) })
  } catch (err) {
    return handleApiError(err)
  }
}
