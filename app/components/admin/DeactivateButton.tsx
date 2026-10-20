'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { apiFetch } from '@/lib/fetcher'

export function DeactivateButton({ propertyId }: { propertyId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function deactivate() {
    if (!confirm('Hide this property from guests? Existing bookings are kept, and you can reactivate it any time.')) return
    setLoading(true)
    try {
      await apiFetch(`/api/admin/properties/${propertyId}`, { method: 'DELETE' })
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-red-100 bg-white p-5">
      <h2 className="text-lg text-navy">Deactivate property</h2>
      <p className="mt-0.5 text-sm text-grey-500">Removes it from search and stops new bookings. Nothing is deleted.</p>
      <Button variant="danger" className="mt-4" onClick={deactivate} loading={loading}>
        Deactivate
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
