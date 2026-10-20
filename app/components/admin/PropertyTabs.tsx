'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function PropertyTabs({ propertyId }: { propertyId: string }) {
  const pathname = usePathname()
  const base = `/admin/properties/${propertyId}`
  const tabs = [
    { href: base, label: 'Details' },
    { href: `${base}/packages`, label: 'Packages' },
    { href: `${base}/pricing`, label: 'Pricing' },
    { href: `${base}/availability`, label: 'Availability' },
  ]

  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-grey-100">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            '-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
            pathname === tab.href ? 'border-coral text-coral' : 'border-transparent text-grey-500 hover:text-navy',
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}
