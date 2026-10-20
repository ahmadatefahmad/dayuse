import { timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { jsonError } from '@/lib/api'

// Vercel Cron sends "Authorization: Bearer $CRON_SECRET". Without a secret the jobs stay locked.
export function rejectUnlessCron(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return jsonError('CRON_SECRET is not configured', 503)
  const given = Buffer.from(request.headers.get('authorization') ?? '')
  const expected = Buffer.from(`Bearer ${secret}`)
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return jsonError('Unauthorized', 401)
  return null
}
