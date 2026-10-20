import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type FieldProps = {
  label: string
  htmlFor?: string
  error?: string
  hint?: string
  className?: string
  children: ReactNode
}

export function Field({ label, htmlFor, error, hint, className, children }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-navy">
        {label}
      </label>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : hint ? <p className="text-xs text-grey-500">{hint}</p> : null}
    </div>
  )
}
