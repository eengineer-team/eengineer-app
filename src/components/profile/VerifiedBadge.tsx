import { Tooltip } from '@/components/ui/tooltip'
import { verifiedLabel, type VerifiedProvider } from '@/lib/verification'
import { cn } from '@/lib/utils'

interface VerifiedBadgeProps {
  /** Which linked account backs the claim. Undefined still renders the badge
   *  (the profile is verified) but with a generic tooltip — a name row should
   *  never lose its check just because the provider column is stale. */
  provider?: VerifiedProvider
  /** `sm` for dense rows (feed bylines, list cards), `md` for profile headers. */
  size?: 'sm' | 'md'
  className?: string
}

// A filled check on a badge-shaped disc, deliberately NOT a plain lucide
// <Check/>: a bare tick next to a name reads as a UI state (selected, done)
// rather than as a property of the person. The scalloped outline is the shape
// people already parse as "verified account" at 14px, which is the whole point
// of the trust signal.
function VerifiedMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 1.5l2.35 1.72 2.9-.25 1.13 2.68 2.67 1.15-.25 2.9L22.5 12l-1.7 2.3.25 2.9-2.67 1.15-1.13 2.68-2.9-.25L12 22.5l-2.35-1.72-2.9.25-1.13-2.68-2.67-1.15.25-2.9L1.5 12l1.7-2.3-.25-2.9 2.67-1.15L6.75 2.97l2.9.25L12 1.5z"
        fill="currentColor"
      />
      {/* Fixed dark ink rather than a theme token: the tick sits *on* the gold
          disc, so it has to contrast with the fill, not with the page behind it. */}
      <path
        d="M7.9 12.3l2.7 2.7 5.5-5.6"
        stroke="#1A160E"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function VerifiedBadge({ provider, size = 'sm', className }: VerifiedBadgeProps) {
  const label = verifiedLabel(provider)

  return (
    <Tooltip label={label} className={cn('inline-flex flex-shrink-0 align-middle', className)}>
      {/* role="img" + aria-label so screen readers announce the trust claim in
          words; the tooltip alone is mouse-only. */}
      <span role="img" aria-label={label} className="inline-flex items-center text-gold-dark">
        <VerifiedMark size={size === 'sm' ? 14 : 17} />
      </span>
    </Tooltip>
  )
}
