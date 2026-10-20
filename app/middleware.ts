import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Refreshes the Supabase session cookie so Server Components always see a valid user,
// and sends signed-out visitors of /account/* to the login page.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return response

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname, search } = request.nextUrl
  if (!user && pathname.startsWith('/account')) {
    const login = new URL('/login', request.url)
    login.searchParams.set('next', pathname + search)
    return NextResponse.redirect(login)
  }
  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/account/:path*',
    '/login',
    '/register',
    '/forgot-password',
    '/auth/:path*',
    '/api/admin/:path*',
    '/api/account/:path*',
    '/api/reviews',
    '/api/upload',
    '/api/properties/:id/review-eligibility',
    '/api/bookings/:path*',
    '/booking/:path*',
    '/checkout',
  ],
}
