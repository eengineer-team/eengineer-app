import { cn } from '@/lib/utils'

interface WordmarkProps {
  // welcome/auth/help/onboarding/legal run on the cornsilk theme; the
  // dashboard sidebar runs on the dark theme — each needs its own token pair.
  variant: 'light' | 'dark'
  size?: 'sm' | 'md'
  className?: string
  // extra classes applied only to the "ngineer" tail — lets the sidebar
  // collapse it to just "ee" at the md breakpoint without a second component.
  tailClassName?: string
}

const ACCENT = { light: 'text-corn-700', dark: 'text-gold-dark' }
const BASE = { light: 'text-corn-900', dark: 'text-white' }
const SIZE = { sm: 'text-[1.125rem]', md: 'text-[1.25rem]' }

// Single wordmark "eengineer" — the leading "ee" is accented to hint the
// ee + engineer wordplay, the rest reads as one word. Not two separate
// logo pieces (monogram + caption) as it used to be rendered per-page.
export function Wordmark({ variant, size = 'md', className, tailClassName }: WordmarkProps) {
  return (
    <span className={cn('font-display font-bold tracking-[-0.03em] leading-none', SIZE[size], className)}>
      <span className={ACCENT[variant]}>ee</span>
      <span className={cn(BASE[variant], tailClassName)}>ngineer</span>
    </span>
  )
}
