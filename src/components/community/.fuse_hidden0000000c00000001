import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { disciplineSlug } from '@/lib/community-data'
import type { CommunityGroupMeta } from '@/lib/community-groups'
import { getDisciplineColor } from '@/lib/discipline-colors'
import { getDisciplineIcon } from '@/lib/discipline-icons'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Redesigned per founder feedback ("with a general picture like this") — a
// banner up top carrying a large, faded discipline icon instead of a plain
// text-only card. Each discipline gets its own tint via discipline-colors.ts,
// so the banner reads as "which discipline" at a glance before you even read
// the label, the same way the reference mockup's colored banner did.
export function DisciplineGroupCard({ group }: { group: CommunityGroupMeta }) {
  const color = getDisciplineColor(group.discipline)
  const Icon = getDisciplineIcon(group.discipline)

  return (
    <Link to={`/dashboard/community/${disciplineSlug(group.discipline)}`}>
      <Card
        theme="dashboard"
        className="p-0 h-full overflow-hidden hover:bg-white/[0.03] transition-colors duration-150"
      >
        {/* Banner */}
        <div
          className={cn(
            'relative h-24 flex items-center justify-center overflow-hidden border-b border-white/8',
            color.border
          )}
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0))' }}
        >
          <Icon size={64} strokeWidth={1.2} className={cn('opacity-[0.14]', color.text)} />
          <span className={cn('absolute top-2.5 left-2.5 w-1.5 h-1.5 rounded-full', color.dot)} />
        </div>

        <div className="p-5">
          <h3 className="font-sans text-[0.9375rem] font-semibold text-white/90 mb-2">{group.discipline}</h3>

          <p className="font-sans text-[0.8125rem] leading-snug text-dark-muted mb-4">{group.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-dark-muted">
              <Users size={12} strokeWidth={1.8} />
              <span className="font-sans text-[11px]">{group.memberCount} members</span>
            </div>

            {group.recentActivityCount > 0 ? (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="font-sans text-[11px] text-white/50">{group.recentActivityCount} new this week</span>
              </div>
            ) : (
              <span className="font-sans text-[11px] text-white/30">Quiet this week</span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
