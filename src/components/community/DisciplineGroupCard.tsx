import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { disciplineSlug } from '@/lib/community-data'
import type { CommunityGroupMeta } from '@/lib/community-groups'
import { getDisciplineColor } from '@/lib/discipline-colors'
import { getDisciplineIcon } from '@/lib/discipline-icons'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Banner is a solid discipline-color field with a specifically-chosen icon
// for that field of study (rocket for Aerospace, cog for Mechanical, etc.),
// not a stock photo and not one generic mark reused everywhere — keeps the
// "which discipline" cue distinct at a glance (per founder feedback that a
// plain text list, and later a single repeated motif, didn't feel distinct
// enough) without an Unsplash dependency or per-discipline image licensing.
export function DisciplineGroupCard({ group }: { group: CommunityGroupMeta }) {
  const color = getDisciplineColor(group.discipline)
  const Icon = getDisciplineIcon(group.discipline)

  return (
    <Link to={`/dashboard/community/${disciplineSlug(group.discipline)}`}>
      <Card
        theme="dashboard"
        className="p-0 h-full overflow-hidden hover:bg-white/[0.03] transition-colors duration-150"
      >
        {/* Banner — solid discipline color + a large faint version of the
            discipline's icon, plus a solid icon "logo" badge up front. */}
        <div className={cn('relative h-24 overflow-hidden border-b', color.border, color.dot)}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/30" />
          <Icon size={150} strokeWidth={1} className="absolute -right-6 -top-6 text-white/15" />
          <span className="absolute top-2.5 left-2.5 w-9 h-9 rounded-full bg-black/35 backdrop-blur-sm ring-1 ring-white/25 flex items-center justify-center">
            <Icon size={18} strokeWidth={2} className="text-white" />
          </span>
        </div>

        <div className="p-5">
          <h3 className="font-sans text-[0.9375rem] font-semibold text-dark-text mb-2">{group.discipline}</h3>

          <p className="font-sans text-[0.8125rem] leading-snug text-dark-muted mb-4">{group.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-dark-muted">
              <Users size={12} strokeWidth={1.8} />
              <span className="font-sans text-[13px]">{group.memberCount} members</span>
            </div>

            {group.recentActivityCount > 0 ? (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="font-sans text-[13px] text-dark-muted">{group.recentActivityCount} new this week</span>
              </div>
            ) : (
              <span className="font-sans text-[13px] text-dark-muted">Quiet this week</span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
