import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { disciplineSlug } from '@/lib/community-data'
import type { CommunityGroupMeta } from '@/lib/community-groups'
import { getDisciplineColor } from '@/lib/discipline-colors'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function DisciplineGroupCard({ group }: { group: CommunityGroupMeta }) {
  const color = getDisciplineColor(group.discipline)

  return (
    <Link to={`/dashboard/community/${disciplineSlug(group.discipline)}`}>
      <Card
        theme="dashboard"
        className={cn('border-t-2 p-5 h-full hover:bg-white/[0.03] transition-colors duration-150', color.border)}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', color.dot)} />
          <h3 className="font-sans text-[0.9375rem] font-semibold text-white/90">{group.discipline}</h3>
        </div>

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
      </Card>
    </Link>
  )
}
