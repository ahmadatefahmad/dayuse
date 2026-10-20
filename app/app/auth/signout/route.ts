import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  if (isSupabaseConfigured()) await createSupabaseServerClient().auth.signOut()
  return NextResponse.redirect(new URL('/login', request.url), { status: 303 })
}
