'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button, buttonClasses } from '@/components/ui/Button'

// Shared body for error.tsx boundaries: explains, logs, and offers a retry.
export function ErrorState({ error, reset, homeHref = '/' }: { error: Error & { digest?: string }; reset: () => void; homeHref?: string }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <section className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <AlertTriangle className="h-10 w-10 text-coral" />
      <h1 className="mt-4 text-3xl text-navy">Something went wrong</h1>
      <p className="mt-3 text-grey-500">This page hit an unexpected error. Nothing has been charged. Please try again in a moment.</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-grey-300">Ref: {error.digest}</p>}
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href={homeHref} className={buttonClasses('secondary')}>
          Go back
        </Link>
      </div>
    </section>
  )
}
