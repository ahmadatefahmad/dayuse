'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Monitor } from 'lucide-react'
import { buttonClasses } from '@/components/ui/Button'

// The admin is built for desktop. Below 768px everything except a single booking's page
// (which the team may need to check on a phone) shows a "please use desktop" message.
const MOBILE_FRIENDLY = /^\/admin\/bookings\/[^/]+$/

export function DesktopOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (MOBILE_FRIENDLY.test(pathname)) return <>{children}</>
  return (
    <>
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center md:hidden">
        <Monitor className="h-10 w-10 text-grey-500" />
        <h1 className="text-2xl text-navy">Please use a desktop</h1>
        <p className="text-sm text-grey-500">The admin dashboard needs a wider screen. Individual bookings can still be opened on a phone from their link.</p>
        <Link href="/" className={buttonClasses('secondary', 'sm', 'mt-2')}>
          Go to the site
        </Link>
      </div>
      <div className="hidden md:block">{children}</div>
    </>
  )
}
