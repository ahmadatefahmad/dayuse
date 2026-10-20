'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { CalendarCheck, LayoutDashboard, LogOut, Menu, UserRound, X } from 'lucide-react'
import { buttonClasses } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const links = [
  { href: '/search', label: 'Explore' },
]

// Auth state is read in the browser so public pages stay cacheable.
function useUser() {
  const [user, setUser] = useState<User | null>(null)
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => data.subscription.unsubscribe()
  }, [])
  return user
}

export function Navbar() {
  const pathname = usePathname()
  const user = useUser()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
    setAccountOpen(false)
  }, [pathname])

  // On the homepage the bar floats transparently over the hero until you scroll.
  const overHero = pathname === '/' && !scrolled && !menuOpen
  const isAdmin = user?.app_metadata?.role === 'admin'
  const initial = (user?.email ?? '?')[0].toUpperCase()

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-40 transition-colors duration-300',
          overHero ? 'bg-transparent text-white' : 'border-b border-grey-100 bg-white/85 text-navy backdrop-blur-md',
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="font-playfair text-2xl">
            DayUse
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={cn('transition-opacity hover:opacity-70', pathname === l.href && 'text-coral')}>
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAccountOpen((o) => !o)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-coral text-sm font-semibold text-white"
                  aria-label="Account menu"
                  aria-expanded={accountOpen}
                >
                  {initial}
                </button>
                {accountOpen && (
                  <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg bg-white text-sm text-grey-700 shadow-lg ring-1 ring-grey-100">
                    <p className="truncate border-b border-grey-100 px-4 py-3 text-xs text-grey-500">{user.email}</p>
                    <Link href="/account/bookings" className="flex items-center gap-2 px-4 py-2.5 hover:bg-grey-50">
                      <CalendarCheck className="h-4 w-4" /> My bookings
                    </Link>
                    <Link href="/account/profile" className="flex items-center gap-2 px-4 py-2.5 hover:bg-grey-50">
                      <UserRound className="h-4 w-4" /> Profile
                    </Link>
                    {isAdmin && (
                      <Link href="/admin/dashboard" className="flex items-center gap-2 px-4 py-2.5 hover:bg-grey-50">
                        <LayoutDashboard className="h-4 w-4" /> Admin dashboard
                      </Link>
                    )}
                    <form action="/auth/signout" method="post">
                      <button className="flex w-full items-center gap-2 px-4 py-2.5 hover:bg-grey-50">
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href={`/login?next=${encodeURIComponent(pathname)}`} className={buttonClasses('ghost', 'sm', overHero ? 'text-white hover:bg-white/10' : '')}>
                  Sign in
                </Link>
                <Link href="/register" className={buttonClasses('primary', 'sm')}>
                  Sign up
                </Link>
              </>
            )}
          </div>

          <button type="button" className="md:hidden" onClick={() => setMenuOpen((o) => !o)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}>
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-grey-100 bg-white px-4 pb-6 pt-2 text-navy md:hidden">
            <nav className="flex flex-col">
              {links.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="border-b border-grey-100 py-3 text-base">
                  {l.label}
                </Link>
              ))}
              {user && (
                <Link href="/account/bookings" className="border-b border-grey-100 py-3 text-base">
                  My account
                </Link>
              )}
              {isAdmin && (
                <Link href="/admin/dashboard" className="border-b border-grey-100 py-3 text-base">
                  Admin dashboard
                </Link>
              )}
            </nav>
            {user ? (
              <form action="/auth/signout" method="post" className="mt-4">
                <p className="mb-2 truncate text-sm text-grey-500">{user.email}</p>
                <button className={buttonClasses('secondary', 'md', 'w-full')}>Sign out</button>
              </form>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link href={`/login?next=${encodeURIComponent(pathname)}`} className={buttonClasses('secondary')}>
                  Sign in
                </Link>
                <Link href="/register" className={buttonClasses()}>
                  Sign up
                </Link>
              </div>
            )}
          </div>
        )}
      </header>
      {/* The bar is fixed; every page except the homepage hero needs room beneath it. */}
      {pathname !== '/' && <div className="h-16" />}
    </>
  )
}
