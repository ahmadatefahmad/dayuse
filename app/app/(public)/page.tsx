import Link from 'next/link'
import { ArrowRight, CreditCard, Search, Sun } from 'lucide-react'
import { HeroSearch } from '@/components/home/HeroSearch'
import { PropertyCard } from '@/components/property/PropertyCard'
import { PropertyImage } from '@/components/property/PropertyImage'
import { buttonClasses } from '@/components/ui/Button'
import { searchProperties } from '@/lib/queries/properties'
import { parseSearchParams } from '@/lib/search'
import { CITIES, citySlug } from '@/lib/validations/property'

// Re-render at most once a minute; admin edits also revalidate this page immediately.
export const revalidate = 60

// Swap for a licensed brand photo before launch.
const HERO_IMAGE = 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=2000&q=80'

const STEPS = [
  { icon: Search, title: 'Pick your spot', body: 'Browse pools, beaches and spas by city and date, with real prices up front.' },
  { icon: CreditCard, title: 'Pay a small fee online', body: 'Secure your day pass with just the booking fee. No full prepayment.' },
  { icon: Sun, title: 'Pay the rest on arrival', body: 'Show your confirmation at the door, settle the balance with the hotel, and enjoy.' },
]

export default async function HomePage() {
  const { properties } = await searchProperties({ ...parseSearchParams({}), limit: 6 })

  return (
    <>
      <section className="relative flex min-h-[640px] items-center justify-center bg-navy px-4 pb-16 pt-28 sm:min-h-[80vh]">
        <div className="absolute inset-0 overflow-hidden">
          <PropertyImage src={HERO_IMAGE} alt="" sizes="100vw" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-navy/70 via-navy/40 to-navy/80" />
        </div>
        <div className="relative flex w-full flex-col items-center text-center text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sand">Hotels · Beach Clubs · Resorts in Egypt</p>
          <h1 className="mt-4 max-w-3xl text-5xl leading-tight sm:text-7xl">Your perfect day escape</h1>
          <p className="mt-4 max-w-xl text-lg text-white/80">Pool, beach and spa access by the day — no overnight stay needed.</p>
          <div className="mt-10 flex w-full justify-center">
            <HeroSearch />
          </div>
        </div>
      </section>

      <section className="border-b border-grey-100 bg-white">
        <div className="mx-auto flex max-w-7xl gap-3 overflow-x-auto px-4 py-5 [scrollbar-width:none] sm:px-6">
          {CITIES.map((c) => (
            <Link
              key={c}
              href={`/search?city=${citySlug(c)}`}
              className="shrink-0 rounded-full border border-grey-300 px-5 py-2 text-sm font-medium text-navy transition-colors hover:border-coral hover:bg-coral hover:text-white"
            >
              {c}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl text-navy sm:text-4xl">Featured escapes</h2>
            <p className="mt-2 text-grey-500">Hand-picked day passes guests love.</p>
          </div>
          <Link href="/search" className="hidden items-center gap-1 text-sm font-medium text-coral hover:underline sm:flex">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {properties.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p, i) => (
              <PropertyCard key={p.id} property={p} priority={i < 3} />
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-grey-300 p-12 text-center text-grey-500">New escapes are on their way. Check back soon.</p>
        )}
        <Link href="/search" className={buttonClasses('secondary', 'md', 'mt-8 w-full sm:hidden')}>
          View all escapes
        </Link>
      </section>

      <section id="how-it-works" className="scroll-mt-16 bg-grey-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-3xl text-navy sm:text-4xl">How it works</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <div key={title} className="rounded-xl bg-white p-6 text-center shadow-sm">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sand/40 text-coral">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-grey-500">Step {i + 1}</p>
                <h3 className="mt-1 text-xl text-navy">{title}</h3>
                <p className="mt-2 text-sm text-grey-500">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
