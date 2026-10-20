import { randomBytes, timingSafeEqual } from 'node:crypto'
import { getCurrentUser, isAdmin } from '@/lib/auth'

// Guests can book without an account, so each booking gets an unguessable token that
// appears in its confirmation link and emails. Owners and admins don't need it.
export const newAccessToken = () => randomBytes(24).toString('base64url')

export const bookingPath = (id: string, token: string) => `/booking/${id}?t=${encodeURIComponent(token)}`

function tokenMatches(expected: string, given?: string | null) {
  if (!given) return false
  const a = Buffer.from(expected)
  const b = Buffer.from(given)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function canAccessBooking(booking: { userId: string | null; accessToken: string }, token?: string | null) {
  if (tokenMatches(booking.accessToken, token)) return true
  const user = await getCurrentUser()
  if (!user) return false
  return isAdmin(user) || (booking.userId !== null && booking.userId === user.id)
}
