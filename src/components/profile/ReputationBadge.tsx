import { Tooltip } from '@/components/ui/tooltip'
import { nextTier, type ReputationTier } from '@/lib/profile-data'
import { cn } from '@/lib/utils'

// Deliberately muted for the entry tiers and only warm at the top. A badge
// that shouts at 0 points makes every new member's profile look like a
// scoreboard they're losing; the colour is the reward, not the label.
const TIER_STYLES: Record<ReputationTier, string> = {
  Builder: 'text-dark-muted border-white/10',
  Contributor: 'text-white/75 border-white/15',
  Mentor: 'text-gold-dark border-gold-dark/30',
  Core: 'text-gold-dark border-gold-dark/60 bg-gold-dark/10',
}

interface ReputationBadgeProps {
  tier: ReputationTier
  points: number
  /** Compact form for dense rows (profile lists, Q&A bylines). */
  size?: 'sm' | 'md'
  className?: string
}

export function ReputationBadge({ tier, points, size = 'md', className }: ReputationBadgeProps) {
  const next = nextTier(points)
  const label = next
    ? `${points} contribution points · ${next.remaining} more to reach ${next.tier}`
    : `${points} contribution points — top tier`

  return (
    <Tooltip label={label}>
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border font-sans font-medium whitespace-nowrap',
          size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-[12px]',
          TIER_STYLES[tier],
          className,
        )}
      >
        {tier}
        <span className="opacity-60 tabular-nums">{points}</span>
      </span>
    </Tooltip>
  )
}
