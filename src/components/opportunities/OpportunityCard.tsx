import { Link } from 'react-router-dom'
import { MapPin, Clock, Sparkles, ArrowUpRight } from 'lucide-react'
import type { Opportunity } from '@/lib/opportunities-data'
import { Chip } from '@/components/ui/chip'
import { Button } from '@/components/ui/button'
import { getDisciplineColor } from '@/lib/discipline-colors'
import { DisciplineMotif } from '@/components/community/DisciplineMotif'
import { cn } from '@/lib/utils'

// Requirements/Responsibilities no longer expand inline here — that detail
// now lives on the opportunity's own page (see OpportunityDetail.tsx), which
// also has room for the full description, a hero image, and the EduGrants
// partner badge. The card itself just teases the listing and hands off via
// "Explore" instead of jumping straight to an external apply link.
export function OpportunityCard({ opportunity, matched }: { opportunity: Opportunity; matched: boolean }) {
  const color = getDisciplineColor(opportunity.discipline)

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-dark-surface border border-white/8 border-t-2 rounded-lg p-5 transition-colors duration-150 hover:border-white/15',
        color.border
      )}
    >
      <DisciplineMotif
        size={110}
        className={cn('absolute -top-4 -right-4 opacity-[0.05]', color.text)}
      />

      <div className="relative flex items-start justify-between gap-3 mb-1">
        <div className="min-w-0">
          <h3 className="font-display text-[0.9375rem] font-semibold text-dark-text leading-tight">
            {opportunity.title}
          </h3>
          <p className="font-sans text-[0.8125rem] text-dark-muted mt-0.5">{opportunity.org}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {matched && (
            <Chip theme="dashboard" tone="deadline" className="flex items-center gap-1">
              <Sparkles size={10} strokeWidth={2} />
              Matched for you
            </Chip>
          )}
          <Chip theme="dashboard" discipline={opportunity.discipline}>{opportunity.discipline}</Chip>
        </div>
      </div>

      <div className="relative flex items-center gap-4 mt-3 mb-4">
        <span className="flex items-center gap-1.5 font-sans text-[12px] text-dark-muted">
          <MapPin size={13} strokeWidth={1.8} />
          {opportunity.location}
        </span>
        <span className="flex items-center gap-1.5 font-sans text-[12px] text-dark-muted">
          <Clock size={13} strokeWidth={1.8} />
          {opportunity.deadline}
        </span>
      </div>

      <div className="relative flex items-center justify-end">
        <Button variant="accent" size="sm" asChild>
          <Link to={`/dashboard/opportunities/${opportunity.id}`}>
            Explore
            <ArrowUpRight size={13} strokeWidth={2} />
          </Link>
        </Button>
      </div>

      {/* Mandatory partner attribution — condition of using edugrants data,
          not optional copyright text. */}
      <p className="relative font-sans text-[11px] text-dark-muted mt-4 pt-3 border-t border-white/8">
        In collaboration with <span className="text-dark-muted">edugrants</span>
      </p>
    </div>
  )
}
