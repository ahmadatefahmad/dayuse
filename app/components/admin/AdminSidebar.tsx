'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Building2, CalendarCheck, LayoutDashboard, LogOut, Star, TicketPercent } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/properties', label: 'Properties', icon: Building2 },
  { href: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/coupons', label: 'Coupons', icon: TicketPercent },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col bg-navy text-white md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0">
      <Link href="/admin/dashboard" className="flex items-baseline gap-2 px-6 py-5">
        <span className="font-playfair text-xl">DayUse</span>
        <span className="text-xs uppercase tracking-widest text-sand">Admin</span>
      </Link>

      <nav className="flex overflow-x-auto [scrollbar-width:none] md:flex-1 md:flex-col md:overflow-visible">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex shrink-0 items-center gap-3 border-b-2 px-4 py-3 text-sm transition-colors md:border-b-0 md:border-l-2 md:px-6 md:py-2.5',
                active ? 'border-coral bg-coral/20 text-coral' : 'border-transparent text-white/70 hover:bg-white/5 hover:text-white',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>

      <form action="/auth/signout" method="post" className="hidden border-t border-white/10 p-4 md:block">
        <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white">
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </form>
    </aside>
  )
}
