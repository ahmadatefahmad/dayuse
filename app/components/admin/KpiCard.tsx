import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type KpiCardProps = {
  title: string
  value: string | number
  icon: LucideIcon
  delta?: { value: string; positive?: boolean }
  hint?: string
}

export function KpiCard({ title, value, icon: Icon, delta, hint }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-grey-100 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-grey-500">{title}</p>
        <span className="rounded-lg bg-teal/10 p-2 text-teal">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 font-playfair text-3xl text-navy">{value}</p>
      {delta ? (
        <p className={cn('mt-1 text-xs font-medium', delta.positive ? 'text-teal' : 'text-coral')}>{delta.value}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-grey-500">{hint}</p>
      ) : null}
    </div>
  )
}
