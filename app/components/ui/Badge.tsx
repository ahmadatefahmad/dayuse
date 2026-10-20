import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const tones = {
  teal: 'bg-teal/15 text-teal',
  grey: 'bg-grey-100 text-grey-500',
  coral: 'bg-coral/15 text-coral',
  // Solid tones read well on top of photos.
  'solid-navy': 'bg-navy text-white',
  'solid-teal': 'bg-teal text-white',
  'solid-coral': 'bg-coral text-white',
}
export type BadgeTone = keyof typeof tones

export function Badge({ tone = 'grey', className, children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone], className)}>{children}</span>
}
