import Link from 'next/link'
import { buttonClasses } from '@/components/ui/Button'

// Stand-in for pages whose content comes later (legal copy, guest sign-up).
export function PlaceholderPage({ title, body }: { title: string; body: string }) {
  return (
    <section className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <h1 className="text-4xl text-navy">{title}</h1>
      <p className="mt-4 text-grey-500">{body}</p>
      <Link href="/search" className={buttonClasses('primary', 'md', 'mt-8')}>
        Explore day passes
      </Link>
    </section>
  )
}
