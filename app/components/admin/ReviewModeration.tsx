'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { apiFetch } from '@/lib/fetcher'

// Approve / reject controls for one review. Rejecting asks for an optional note shown to the guest.
export function ReviewModeration({ reviewId, status }: { reviewId: string; status: string }) {
  const router = useRouter()
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function moderate(action: 'approve' | 'reject') {
    setBusy(action)
    setError(null)
    try {
      await apiFetch(`/api/admin/reviews/${reviewId}`, { method: 'PATCH', json: { action, adminNote: action === 'reject' ? note : undefined } })
      setRejecting(false)
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-2">
      {rejecting ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for the guest (optional), e.g. contains personal details" aria-label="Rejection note" autoFocus />
          <div className="flex gap-2">
            <Button variant="danger" onClick={() => moderate('reject')} loading={busy === 'reject'}>
              Confirm reject
            </Button>
            <Button variant="ghost" onClick={() => setRejecting(false)}>
              Back
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          {status !== 'approved' && (
            <Button className="bg-[#1F9C86] hover:bg-[#1F9C86]/90" onClick={() => moderate('approve')} loading={busy === 'approve'}>
              <Check className="h-4 w-4" /> Approve
            </Button>
          )}
          {status !== 'rejected' && (
            <Button variant="danger" onClick={() => setRejecting(true)}>
              <X className="h-4 w-4" /> Reject
            </Button>
          )}
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
