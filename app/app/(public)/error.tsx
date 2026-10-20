'use client'

import { ErrorState } from '@/components/layout/ErrorState'

// Keeps the navbar and footer when a public page fails.
export default function PublicError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState {...props} />
}
