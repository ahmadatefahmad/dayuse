import { forwardRef, type InputHTMLAttributes } from 'react'

type ToggleProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: string }

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(function Toggle({ label, ...props }, ref) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3 text-sm text-navy">
      <input ref={ref} type="checkbox" className="peer sr-only" {...props} />
      <span className="relative h-6 w-11 shrink-0 rounded-full bg-grey-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-teal peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-teal/40" />
      {label}
    </label>
  )
})
