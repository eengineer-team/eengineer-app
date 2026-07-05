import { MapPin, Clock } from 'lucide-react'
import type { Opportunity } from '@/lib/opportunities-data'
import { Chip } from '@/components/ui/chip'
import { LabelCaps } from '@/components/ui/label-caps'

export function OpportunityCard({ opportunity, matched }: { opportunity: Opportunity; matched: boolean }) {
  return (
    <div className="bg-dark-surface border border-white/8 rounded-lg p-5">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="min-w-0">
          <h3 className="font-display text-[0.9375rem] font-semibold text-dark-text leading-tight">
            {opportunity.title}
          </h3>
          <p className="font-sans text-[0.8125rem] text-dark-muted mt-0.5">{opportunity.org}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {matched && (
            <Chip theme="dashboard" tone="deadline">
              Matched for you
            </Chip>
          )}
          <Chip theme="dashboard">{opportunity.discipline}</Chip>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-3 mb-4">
        <span className="flex items-center gap-1.5 font-sans text-[12px] text-white/50">
          <MapPin size={13} strokeWidth={1.8} />
          {opportunity.location}
        </span>
        <span className="flex items-center gap-1.5 font-sans text-[12px] text-white/50">
          <Clock size={13} strokeWidth={1.8} />
          {opportunity.deadline}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <LabelCaps className="block mb-1.5">Requirements</LabelCaps>
          <ul className="flex flex-col gap-1">
            {opportunity.requirements.map((r, i) => (
              <li key={i} className="font-sans text-[0.8125rem] text-dark-muted leading-snug pl-3 relative before:content-['—'] before:absolute before:left-0 before:text-white/30">
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <LabelCaps className="block mb-1.5">Responsibilities</LabelCaps>
          <ul className="flex flex-col gap-1">
            {opportunity.responsibilities.map((r, i) => (
              <li key={i} className="font-sans text-[0.8125rem] text-dark-muted leading-snug pl-3 relative before:content-['—'] before:absolute before:left-0 before:text-white/30">
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Mandatory partner attribution — condition of using edugrants data, not optional copyright text. */}
      <p className="font-sans text-[11px] text-white/35 pt-3 border-t border-white/8">
        In collaboration with <span className="text-white/55">edugrants</span>
      </p>
    </div>
  )
}
