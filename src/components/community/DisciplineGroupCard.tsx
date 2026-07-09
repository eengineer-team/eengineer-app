import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { disciplineSlug } from '@/lib/community-data'
import type { CommunityGroupMeta } from '@/lib/community-groups'
import { getDisciplineColor } from '@/lib/discipline-colors'
import { getDisciplineBg } from '@/lib/discipline-bg'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// SCOPED OVERRIDE — founder-risky-edits branch only (09.07.2026). Normal
// project rules call for the flat dashboard surface language here (see the
// icon-watermark version this replaces); founder asked for the literal
// "full-bleed photo per discipline, faded, text on top" build anyway, for
// side-by-side comparison against main. Not a recommendation — see the
// commit message for the readability/contrast critique. Photos are real
// Wikimedia Commons images standing in for real stock photography; several
// require attribution before this could ever ship (public/discipline-bg/
// CREDITS.md has source + license per image).
export function DisciplineGroupCard({ group }: { group: CommunityGroupMeta }) {
  const color = getDisciplineColor(group.discipline)
  const bg = getDisciplineBg(group.discipline)

  return (
    <Link to={`/dashboard/community/${disciplineSlug(group.discipline)}`}>
      <Card
        theme="dashboard"
        className="relative p-0 h-full min-h-[220px] overflow-hidden hover:brightness-110 transition-[filter] duration-150"
      >
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url(${bg})` }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-dark-100 via-dark-100/75 to-dark-100/25"
          aria-hidden="true"
        />

        <div className="relative flex flex-col h-full p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', color.dot)} />
            <h3 className="font-sans text-[0.9375rem] font-semibold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">
              {group.discipline}
            </h3>
          </div>

          <p className="font-sans text-[0.8125rem] leading-snug text-white/85 mb-4 [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">
            {group.description}
          </p>

          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-white/75">
              <Users size={12} strokeWidth={1.8} />
              <span className="font-sans text-[11px]">{group.memberCount} members</span>
            </div>

            {group.recentActivityCount > 0 ? (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="font-sans text-[11px] text-white/85">{group.recentActivityCount} new this week</span>
              </div>
            ) : (
              <span className="font-sans text-[11px] text-white/50">Quiet this week</span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
