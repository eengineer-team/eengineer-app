import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MapPin, Clock, ChevronDown } from 'lucide-react'
import type { Opportunity } from '@/lib/opportunities-data'
import { Chip } from '@/components/ui/chip'
import { LabelCaps } from '@/components/ui/label-caps'

// Collapsed by default — six full-length cards (title, org, badges,
// requirements, responsibilities, credit) back to back made the page read
// as one huge wall of text. Requirements/Responsibilities now hide behind a
// toggle, animated open/closed with framer-motion (same library the rest of
// the app's motion already runs on) instead of popping in/out instantly.
export function OpportunityCard({ opportunity, matched }: { opportunity: Opportunity; matched: boolean }) {
  const [expanded, setExpanded] = React.useState(false)

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
          <Chip theme="dashboard" discipline={opportunity.discipline}>{opportunity.discipline}</Chip>
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

      <button
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex items-center gap-1.5 font-sans text-[12px] font-medium text-gold-dark hover:brightness-110 transition-all"
      >
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="inline-flex"
        >
          <ChevronDown size={14} strokeWidth={2} />
        </motion.span>
        {expanded ? 'Hide requirements & responsibilities' : 'View requirements & responsibilities'}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-px">
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mandatory partner attribution — condition of using edugrants data,
          not optional copyright text. Stays visible whether the card is
          expanded or not, unlike Requirements/Responsibilities. */}
      <p className="font-sans text-[11px] text-white/35 mt-4 pt-3 border-t border-white/8">
        In collaboration with <span className="text-white/55">edugrants</span>
      </p>
    </div>
  )
}
