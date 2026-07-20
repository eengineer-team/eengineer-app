import { motion } from 'framer-motion'
import { Wordmark } from '@/components/ui/wordmark'

// Brand boot screen shown while the Supabase session resolves. On-brand: an
// engineer's dimension line that draws itself across the page like a plotter
// taking a measurement, then resets — "measuring you in". Theme-aware so it
// matches whatever screen it precedes (cornsilk for auth, dark for dashboard).
export function AppLoader({ theme = 'light' }: { theme?: 'light' | 'dark' }) {
  const dark = theme === 'dark'
  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center gap-7 ${
        dark ? 'bg-dark-radial' : 'bg-corn-100 bg-graph-paper'
      }`}
    >
      <Wordmark variant={dark ? 'dark' : 'light'} />

      {/* Self-drawing measurement line (loops). Reduced-motion users get the
          static line via framer-motion's global reduced-motion handling. */}
      <svg
        width="200"
        height="14"
        viewBox="0 0 200 14"
        fill="none"
        aria-hidden="true"
        className={dark ? 'text-gold-dark' : 'text-corn-700'}
      >
        <path d="M1 2v10M199 2v10" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        <motion.path
          d="M1 7h198"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0.9 }}
          animate={{ pathLength: [0, 1, 1], opacity: [0.9, 0.9, 0] }}
          transition={{ duration: 1.5, times: [0, 0.68, 1], repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.path
          d="M6 4L2 7l4 3M194 4l4 3-4 3"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 1] }}
          transition={{ duration: 1.5, times: [0, 0.68, 1], repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
        />
      </svg>

      <span
        className={`font-sans italic text-[13px] tracking-wide ${
          dark ? 'text-dark-muted' : 'text-corn-700'
        }`}
      >
        measuring you in…
      </span>
    </div>
  )
}
