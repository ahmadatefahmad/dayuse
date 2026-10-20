import { LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Spinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return <LoaderCircle role="status" aria-label={label} className={cn('h-5 w-5 animate-spin text-coral', className)} />
}
