import { cn } from '@/lib/utils'

// Admin status colours from the Module 08 spec. Always shows the word, never colour alone.
const STYLES: Record<string, string> = {
  pending: 'bg-grey-100 text-grey-700',
  confirmed: 'bg-teal/15 text-[#13715F]',
  cancelled: 'bg-red-50 text-red-700',
  completed: 'bg-navy text-white',
  changed: 'bg-amber-100 text-amber-800',
}

export function BookingStatusPill({ status }: { status: string }) {
  return <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', STYLES[status] ?? STYLES.pending)}>{status}</span>
}
