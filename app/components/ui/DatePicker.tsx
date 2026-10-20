import { forwardRef, type InputHTMLAttributes } from 'react'
import { CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

type DatePickerProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

// Native date input (best mobile UX) with the site's styling and a calendar icon.
export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker({ className, ...props }, ref) {
  return (
    <div className="relative">
      <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grey-500" />
      <input
        ref={ref}
        type="date"
        className={cn(
          'h-10 w-full rounded-lg border border-grey-300 bg-white pl-9 pr-3 text-sm text-navy focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20',
          className,
        )}
        {...props}
      />
    </div>
  )
})
