import { cn } from '@/lib/utils'

// Brand geometric motif — a technical-drawing crosshair/arc mark used
// wherever a discipline needs a decorative background (community card
// banners, group-page watermark, opportunity/competition accents). Colored
// entirely via `currentColor` (pass a text-* class), so it reads as the
// same "engineer's notebook" mark everywhere instead of a per-discipline
// stock icon (rocket/gear/lightning etc).
export function DisciplineMotif({ size = 200, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      className={cn('pointer-events-none', className)}
      aria-hidden="true"
    >
      <circle cx="100" cy="100" r="86" stroke="currentColor" strokeWidth="1" />
      <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="1" strokeDasharray="2 6" />
      <path d="M100 4V36M100 164V196M4 100H36M164 100H196" stroke="currentColor" strokeWidth="1" />
      <path d="M100 40 L100 100 L145 100" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="3" fill="currentColor" />
    </svg>
  )
}
