'use client'

import { ErrorState } from '@/components/layout/ErrorState'

// Keeps the admin sidebar when an admin page fails.
export default function AdminError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState {...props} homeHref="/admin/dashboard" />
}
