'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { apiFetch } from '@/lib/fetcher'

type Props = { bookingId: string; status: string; canComplete: boolean; note: string | null; platformFee: number }

export function BookingAdminActions({ bookingId, status, canComplete, note, platformFee }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<'complete' | 'cancel' | 'note' | null>(null)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [draft, setDraft] = useState(note ?? '')

  async function run(action: 'complete' | 'cancel' | 'note', confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return
    setBusy(action)
    setMessage(null)
    try {
      await apiFetch(`/api/admin/bookings/${bookingId}`, { method: 'PATCH', json: action === 'note' ? { action, note: draft } : { action } })
      setMessage({ ok: true, text: { complete: 'Marked as completed.', cancel: 'Booking cancelled.', note: 'Note saved.' }[action] })
      router.refresh()
    } catch (e) {
      setMessage({ ok: false, text: (e as Error).message })
    } finally {
      setBusy(null)
    }
  }

  const cancelText =
    status === 'pending'
      ? 'Void this unpaid booking? Its payment link stops working. The guest is not notified.'
      : platformFee > 0
        ? 'Cancel this booking? The online booking fee will be refunded via Stripe and the guest notified.'
        : 'Cancel this booking? The guest will be notified.'

  return (
    <div className="space-y-5">
      {(canComplete || status === 'confirmed' || status === 'pending') && (
        <div className="flex flex-wrap gap-2">
          {canComplete && (
            <Button variant="secondary" onClick={() => run('complete')} loading={busy === 'complete'}>
              <CheckCircle2 className="h-4 w-4 text-teal" /> Mark as completed
            </Button>
          )}
          {(status === 'confirmed' || status === 'pending') && (
            <Button variant="danger" onClick={() => run('cancel', cancelText)} loading={busy === 'cancel'}>
              <XCircle className="h-4 w-4" /> {status === 'pending' ? 'Void unpaid booking' : 'Cancel booking'}
            </Button>
          )}
        </div>
      )}
      <div className="space-y-2">
        <label htmlFor="internal-note" className="block text-sm font-medium text-navy">
          Internal note <span className="font-normal text-grey-500">(team only, never shown to the guest)</span>
        </label>
        <Textarea id="internal-note" rows={3} className="min-h-[80px]" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <Button variant="secondary" size="sm" onClick={() => run('note')} loading={busy === 'note'} disabled={draft === (note ?? '')}>
          Save note
        </Button>
      </div>
      {message && <p className={message.ok ? 'text-sm text-teal' : 'text-sm text-red-600'}>{message.text}</p>}
    </div>
  )
}
