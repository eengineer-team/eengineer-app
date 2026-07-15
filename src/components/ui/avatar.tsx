import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}

const avatarVariants = cva('rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden', {
  variants: {
    size: {
      sm: 'w-6 h-6',
      md: 'w-10 h-10',
      lg: 'w-16 h-16',
    },
    theme: {
      welcome:   'bg-corn-900 text-corn-100',
      dashboard: 'bg-corn-700/80 text-white',
    },
  },
  defaultVariants: {
    size: 'md',
    theme: 'dashboard',
  },
})

const initialsFontSize: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'text-[12px]',
  md: 'text-[0.75rem]',
  lg: 'text-lg',
}

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  name: string
  src?: string
  className?: string
}

// Initials circle until a real photo exists; photo mode uses the same crop
// so switching one for the other doesn't shift layout.
function Avatar({ name, src, size = 'md', theme = 'dashboard', className }: AvatarProps) {
  const [imgFailed, setImgFailed] = React.useState(false)
  const s = size ?? 'md'

  if (src && !imgFailed) {
    return (
      <div className={cn(avatarVariants({ size, theme, className }))}>
        <img src={src} alt={name} className="w-full h-full object-cover" onError={() => setImgFailed(true)} />
      </div>
    )
  }

  return (
    <div className={cn(avatarVariants({ size, theme, className }))}>
      <span className={cn('font-display font-bold leading-none', initialsFontSize[s])}>{initials(name)}</span>
    </div>
  )
}

export { Avatar, avatarVariants }
