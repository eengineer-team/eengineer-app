import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { disciplineSlug } from '@/lib/community-data'
import type { CommunityGroupMeta } from '@/lib/community-groups'
import { getDisciplineColor } from '@/lib/discipline-colors'
import { DisciplineMotif } from '@/components/community/DisciplineMotif'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Banner is a solid discipline-color field with a faint technical-drawing
// motif, not a stock photo — keeps the "which discipline" cue (per founder
// feedback that a plain text list didn't feel distinct enough) without an
// Unsplash dependency or per-discipline image sourcing/licensing.
export function DisciplineGroupCard({ group }: { group: CommunityGroupMeta }) {
  const color = getDisciplineColor(group.discipline)

  return (
    <Link to={`/dashboard/community/${disciplineSlug(group.discipline)}`}>
      <Card
        theme="dashboard"
        className="p-0 h-full overflow-hidden hover:bg-white/[0.03] transition-colors duration-150"
      >
        {/* Banner — solid discipline color + faint brand motif */}
        <div className={cn('relative h-24 overflow-hidden border-b', color.border, color.dot)}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/30" />
          <DisciplineMotif size={170} className="absolute -right-8 -top-8 text-white/15" />
          <span className="absolute top-2.5 left-2.5 w-1.5 h-1.5 rounded-full bg-white/90 ring-1 ring-black/30" />
        </div>

        <div className="p-5">
          <h3 className="font-sans text-[0.9375rem] font-semibold text-dark-text mb-2">{group.discipline}</h3>

          <p className="font-sans text-[0.8125rem] leading-snug text-dark-muted mb-4">{group.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-dark-muted">
              <Users size={12} strokeWidth={1.8} />
              <span className="font-sans text-[11px]">{group.memberCount} members</span>
            </div>

            {group.recentActivityCount > 0 ? (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="font-sans text-[11px] text-dark-muted">{group.recentActivityCount} new this week</span>
              </div>
            ) : (
              <span className="font-sans text-[11px] text-dark-muted">Quiet this week</span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
