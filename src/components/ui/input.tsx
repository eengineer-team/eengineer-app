import * as React from 'react'
import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        'w-full rounded border border-corn-900/15 bg-white/50 px-3.5 py-2.5',
        'font-sans text-sm text-[#2A2118] placeholder:text-corn-700/45',
        'transition-colors duration-150',
        'focus:outline-none focus:border-corn-700 focus:bg-white/80',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export { Input }
