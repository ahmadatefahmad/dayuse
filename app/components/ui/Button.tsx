import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const variants = {
  primary: 'bg-coral text-white hover:bg-coral/90',
  secondary: 'bg-white text-navy border border-grey-300 hover:bg-grey-50',
  ghost: 'text-grey-700 hover:bg-grey-100',
  danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
}
const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export type ButtonVariant = keyof typeof variants

export const buttonClasses = (variant: ButtonVariant = 'primary', size: keyof typeof sizes = 'md', className?: string) =>
  cn(
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-coral/50',
    variants[variant],
    sizes[size],
    className,
  )

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: keyof typeof sizes
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, loading, className, children, disabled, type = 'button', ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} disabled={disabled || loading} className={buttonClasses(variant, size, className)} {...props}>
      {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
})
