import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// OVERVIEW / TRUST / SKILLS / CONNECTION REQUESTS / UPCOMING DEADLINES — the
// recurring caps-label pattern. One component so tracking/size/color don't
// drift screen to screen. Not the shadcn form Label (src/components/ui/label.tsx).
const labelCapsVariants = cva('font-sans text-[11px] font-medium uppercase tracking-[0.16em]', {
  variants: {
    theme: {
      welcome:   'text-corn-700',
      dashboard: 'text-dark-muted',
    },
  },
  defaultVariants: {
    theme: 'dashboard',
  },
})

export interface LabelCapsProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof labelCapsVariants> {}

const LabelCaps = React.forwardRef<HTMLSpanElement, LabelCapsProps>(
  ({ className, theme, ...props }, ref) => (
    <span ref={ref} className={cn(labelCapsVariants({ theme, className }))} {...props} />
  )
)
LabelCaps.displayName = 'LabelCaps'

export { LabelCaps, labelCapsVariants }
