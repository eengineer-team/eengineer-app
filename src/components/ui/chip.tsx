import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Discipline/skill/deadline badges (Aerospace, MATLAB, "Applications close…").
// One component so every screen renders these identically instead of each
// hand-rolling its own badge classes.
const chipVariants = cva('inline-flex items-center rounded px-2.5 py-0.5 font-sans text-xs', {
  variants: {
    theme: {
      welcome:   'bg-corn-900/6 text-corn-800',
      dashboard: 'bg-white/6 text-dark-muted border border-white/10',
    },
    tone: {
      default: '',
      deadline: '',
    },
  },
  compoundVariants: [
    { theme: 'dashboard', tone: 'deadline', className: 'border-gold-dark/40 text-gold-dark bg-gold-dark/10' },
    { theme: 'welcome', tone: 'deadline', className: 'text-corn-700 bg-corn-700/10' },
  ],
  defaultVariants: {
    theme: 'dashboard',
    tone: 'default',
  },
})

export interface ChipProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chipVariants> {}

const Chip = React.forwardRef<HTMLSpanElement, ChipProps>(
  ({ className, theme, tone, ...props }, ref) => (
    <span ref={ref} className={cn(chipVariants({ theme, tone, className }))} {...props} />
  )
)
Chip.displayName = 'Chip'

export { Chip, chipVariants }
