import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { disciplineSlug } from '@/lib/community-data'
import type { CommunityGroupMeta } from '@/lib/community-groups'
import { getDisciplineColor } from '@/lib/discipline-colors'
import { getDisciplineBg } from '@/lib/discipline-bg'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Redesigned per founder feedback ("with a general picture like this",
// referencing AP Students' blurred course-photo cards) — a real photo
// banner, blurred and tinted with the discipline's color, replacing the
// earlier faint-icon-watermark version. The title/description/stats stay in
// the solid card body below the banner rather than overlaid on the photo, so
// text contrast never depends on how bright or busy a given photo is.
export function DisciplineGroupCard({ group }: { group: CommunityGroupMeta }) {
  const color = getDisciplineColor(group.discipline)
  const bg = getDisciplineBg(group.discipline)

  return (
    <Link to={`/dashboard/community/${disciplineSlug(group.discipline)}`}>
      <Card
        theme="dashboard"
        className="p-0 h-full overflow-hidden hover:bg-white/[0.03] transition-colors duration-150"
      >
        {/* Banner — blurred, color-tinted photo */}
        <div className={cn('relative h-24 overflow-hidden border-b', color.border)}>
          <img
            src={bg}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover scale-110 blur-[3px]"
          />
          <div className={cn('absolute inset-0 opacity-55 mix-blend-multiply', color.dot)} />
          <div className="absolute inset-0 bg-dark-100/20" />
          <span className={cn('absolute top-2.5 left-2.5 w-1.5 h-1.5 rounded-full ring-1 ring-black/40', color.dot)} />
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
              <span className="font-sans text-[11px] text-white/30">Quiet this week</span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
