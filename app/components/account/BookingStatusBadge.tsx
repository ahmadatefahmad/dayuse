import { Badge, type BadgeTone } from '@/components/ui/Badge'

// "Upcoming" vs "Visited" is clearer to guests than raw statuses.
export function BookingStatusBadge({ status, isPast }: { status: string; isPast: boolean }) {
  const [tone, label]: [BadgeTone, string] =
    status === 'cancelled' ? ['grey', 'Cancelled'] : status === 'pending' ? ['coral', 'Awaiting payment'] : isPast || status === 'completed' ? ['grey', 'Visited'] : ['teal', 'Upcoming']
  return <Badge tone={tone}>{label}</Badge>
}
