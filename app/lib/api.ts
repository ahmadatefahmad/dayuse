import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import Stripe from 'stripe'
import { ensureUserRecord } from '@/lib/account'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { BookingError } from '@/lib/booking-quote'

// Every API error has the same shape: { error: human message, code: machine-readable }.
const ERROR_CODES: Record<number, string> = {
  400: 'bad_request',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  500: 'server_error',
  502: 'payment_provider_error',
  503: 'service_unavailable',
}
export const jsonError = (error: string, status: number, code = ERROR_CODES[status] ?? 'error') => NextResponse.json({ error, code }, { status })

// Call after admin edits that change what guests see, so cached public pages update immediately.
export function revalidatePublicPages(propertyId?: string) {
  revalidatePath('/')
  if (propertyId) revalidatePath(`/property/${propertyId}`)
}

// Returns an error response when the caller is not an admin, otherwise null.
//   const denied = await requireAdmin(); if (denied) return denied
export async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user) return jsonError('Not signed in', 401)
  if (!isAdmin(user)) return jsonError('Admin access required', 403)
  return null
}

// For guest-account routes: the signed-in user (with their User row ensured), or a 401 response.
//   const auth = await requireUser(); if (auth instanceof NextResponse) return auth
export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) return jsonError('Not signed in', 401)
  await ensureUserRecord(user)
  return user
}

export function handleApiError(err: unknown) {
  if (err instanceof BookingError) return jsonError(err.message, err.status)
  if (err instanceof Stripe.errors.StripeError) {
    console.error('Stripe error', err.type, err.code, err.message)
    return jsonError('The payment provider rejected the request. Please try again.', 502)
  }
  if (err instanceof ZodError) {
    const issue = err.issues[0]
    const path = issue.path.join('.')
    return jsonError(path ? `${path}: ${issue.message}` : issue.message, 400)
  }
  if (err instanceof SyntaxError) return jsonError('Invalid JSON body', 400)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[] | undefined)?.join(', ') ?? 'value'
      return jsonError(`That ${target} is already taken`, 409)
    }
    if (err.code === 'P2025') return jsonError('Not found', 404)
  }
  console.error(err)
  return jsonError('Something went wrong', 500)
}
