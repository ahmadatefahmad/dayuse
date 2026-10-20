import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

// Read-only star row; supports fractional ratings via a clipped overlay.
export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn('relative inline-flex', className)} aria-label={`${rating.toFixed(1)} out of 5`}>
      <span className="flex gap-0.5 text-grey-300">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className="h-4 w-4 fill-current" />
        ))}
      </span>
      <span className="absolute inset-0 flex gap-0.5 overflow-hidden text-coral" style={{ width: `${(rating / 5) * 100}%` }}>
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className="h-4 w-4 shrink-0 fill-current" />
        ))}
      </span>
    </span>
  )
}
