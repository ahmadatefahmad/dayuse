import { NextResponse, type NextRequest } from 'next/server'
import { safeNextPath } from '@/lib/auth'
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase-server'

// Landing point for Supabase email links (sign-up confirmation, password reset).
// Exchanges the one-time code for a session cookie, then continues to ?next=.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const next = safeNextPath(request.nextUrl.searchParams.get('next'))
  if (code && isSupabaseConfigured()) {
    const { error } = await createSupabaseServerClient().auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, request.url))
  }
  return NextResponse.redirect(new URL('/login?error=link_expired', request.url))
}
