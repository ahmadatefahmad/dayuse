import Link from 'next/link'
import { CITIES, citySlug } from '@/lib/validations/property'

export function Footer() {
  return (
    <footer className="bg-navy text-white/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <Link href="/" className="font-playfair text-2xl text-white">
            DayUse
          </Link>
          <p className="mt-3 max-w-xs text-sm">Day passes to Egypt&apos;s best hotels, beach clubs and resorts. Pay a small fee online, the rest on arrival.</p>
        </div>
        <div>
          <h2 className="font-inter text-xs font-semibold uppercase tracking-widest text-sand">Cities</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {CITIES.map((c) => (
              <li key={c}>
                <Link href={`/search?city=${citySlug(c)}`} className="hover:text-white">
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-inter text-xs font-semibold uppercase tracking-widest text-sand">Legal</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/privacy" className="hover:text-white">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white">
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <p className="border-t border-white/10 px-4 py-6 text-center text-xs">© {new Date().getFullYear()} DayUse Egypt. All rights reserved.</p>
    </footer>
  )
}
