import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase-server'

// The role lives in app_metadata, which only the service role / database can write.
// user_metadata is editable by the signed-in user from the browser, so it must never grant admin.
export const isAdmin = (user: User | null) => user?.app_metadata?.role === 'admin'

// Uses getUser(), which validates the token with Supabase. (getSession() only reads the
// cookie and can't be trusted on the server, so it isn't used for authorization.)
export async function getCurrentUser() {
  if (!isSupabaseConfigured()) return null
  const supabase = createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  return data.user
}

// For Server Components: the signed-in user, or a redirect to /login that comes back here.
export async function requireAuth(returnTo: string) {
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`)
  return user
}

// Only allow same-site relative paths, so ?next= can't redirect off-site.
export const safeNextPath = (next: string | null | undefined, fallback = '/account') =>
  next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : fallback
