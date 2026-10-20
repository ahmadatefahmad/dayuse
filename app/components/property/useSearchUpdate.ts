'use client'

import { useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

// Filter state lives in the URL. update({ city: 'cairo', type: null }) sets/removes params,
// resets pagination, and navigates without scrolling to the top.
export function useSearchUpdate() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  function update(changes: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    params.delete('page')
    const qs = params.toString()
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
  }

  return { searchParams, update, pending }
}
