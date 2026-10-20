import Link from 'next/link'
import type { ReactNode } from 'react'

// Centered card with a navy header, shared by sign-in, sign-up and password pages.
export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-grey-50 px-4 py-12">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="bg-navy px-8 py-6">
          <Link href="/" className="font-playfair text-2xl text-white">
            DayUse <span className="font-inter text-xs uppercase tracking-widest text-sand">Egypt</span>
          </Link>
        </div>
        <div className="p-8">
          <h1 className="text-2xl text-navy">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-grey-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="border-t border-grey-100 bg-grey-50 px-8 py-4 text-center text-sm text-grey-500">{footer}</div>}
      </div>
    </main>
  )
}
