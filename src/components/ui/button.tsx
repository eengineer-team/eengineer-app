import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-sans font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-corn-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 select-none',
  {
    variants: {
      variant: {
        // Pre-auth dark CTA
        primary: 'bg-corn-900 text-corn-100 hover:bg-corn-800 active:bg-corn-900',
        // Pre-auth ghost/outline
        ghost:   'border border-corn-900/30 text-corn-900 hover:bg-corn-900/8 active:bg-corn-900/12',
        // Post-auth white-tint (used in dark shell)
        shell:   'text-white/80 hover:bg-white/7 active:bg-white/12',
        // Post-auth solid CTA (dashboard gold — corn-700 dims on dark, gold-dark is the correct dashboard accent)
        accent:  'bg-gold-dark text-dark-900 hover:brightness-110 active:brightness-95',
        // Completed-action state (Registered, Connected) — an accent outline +
        // leading check, NOT grey/disabled-looking. Same action, two states:
        // don't render a separate disabled-style element for "done".
        done:    'bg-transparent border border-gold-dark text-gold-dark hover:bg-gold-dark/10',
        // Destructive confirm (delete) — distinct red CTA, never the default accent.
        danger:  'bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25',
      },
      size: {
        sm:   'px-4 py-2 min-h-[40px] text-sm rounded',
        md:   'px-6 py-3 text-base rounded',
        lg:   'px-8 py-3.5 text-base rounded-sm tracking-wide',
        icon: 'p-2 rounded',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
