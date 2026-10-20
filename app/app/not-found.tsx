import Link from 'next/link'
import { buttonClasses } from '@/components/ui/Button'

export const metadata = { title: 'Page not found — DayUse Egypt' }

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-grey-50 px-4 text-center">
      <Link href="/" className="font-playfair text-2xl text-navy">
        DayUse
      </Link>
      <p className="mt-10 font-playfair text-6xl text-coral">404</p>
      <h1 className="mt-2 text-2xl text-navy">This page took the day off</h1>
      <p className="mt-2 max-w-sm text-grey-500">The link may be old or mistyped. Your next escape is just a search away.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/search" className={buttonClasses()}>
          Explore day passes
        </Link>
        <Link href="/" className={buttonClasses('secondary')}>
          Home
        </Link>
      </div>
    </main>
  )
}
