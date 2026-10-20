import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const isSupabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

// Supabase client for Server Components, Route Handlers and Server Actions.
export function createSupabaseServerClient() {
  const cookieStore = cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Called from a Server Component, where cookies are read-only. middleware.ts refreshes the session instead.
        }
      },
    },
  })
}
