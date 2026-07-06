import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { getDisciplineColor } from '@/lib/discipline-colors'

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
    VariantProps<typeof chipVariants> {
  /** Discipline label (e.g. "Aerospace") — tints the chip border and adds a
   *  leading color dot via getDisciplineColor(). Functional coding, not decor. */
  discipline?: string
}

const Chip = React.forwardRef<HTMLSpanElement, ChipProps>(
  ({ className, theme, tone, discipline, children, ...props }, ref) => {
    const disciplineColor = discipline ? getDisciplineColor(discipline) : null
    return (
      <span
        ref={ref}
        className={cn(
          chipVariants({ theme, tone, className }),
          disciplineColor && `border ${disciplineColor.border}`
        )}
        {...props}
      >
        {disciplineColor && (
          <span className={cn('inline-block w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0', disciplineColor.dot)} />
        )}
        {children}
      </span>
    )
  }
)
Chip.displayName = 'Chip'

export { Chip, chipVariants }
