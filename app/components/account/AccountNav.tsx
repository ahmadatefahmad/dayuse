'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarCheck, Star, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/account/bookings', label: 'Bookings', icon: CalendarCheck },
  { href: '/account/reviews', label: 'Reviews', icon: Star },
  { href: '/account/profile', label: 'Profile', icon: UserRound },
]

export function AccountNav() {
  const pathname = usePathname()
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-grey-100 [scrollbar-width:none]">
      {LINKS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            '-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
            pathname.startsWith(href) ? 'border-coral text-coral' : 'border-transparent text-grey-500 hover:text-navy',
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  )
}
