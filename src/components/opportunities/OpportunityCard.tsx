import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MapPin, Clock, ChevronDown, Sparkles, ArrowUpRight } from 'lucide-react'
import type { Opportunity } from '@/lib/opportunities-data'
import { Chip } from '@/components/ui/chip'
import { LabelCaps } from '@/components/ui/label-caps'
import { Button } from '@/components/ui/button'
import { getDisciplineColor } from '@/lib/discipline-colors'
import { DisciplineMotif } from '@/components/community/DisciplineMotif'
import { cn } from '@/lib/utils'

// Collapsed by default — six full-length cards (title, org, badges,
// requirements, responsibilities, credit) back to back made the page read
// as one huge wall of text. Requirements/Responsibilities now hide behind a
// toggle, animated open/closed with framer-motion (same library the rest of
// the app's motion already runs on) instead of popping in/out instantly.
//
// Visual pass (founder: "make the design better"): a discipline-tinted top
// accent + faded watermark icon, same language as the Community hub cards,
// so opportunities read as belonging to the same product instead of a
// plainer, older screen.
export function OpportunityCard({ opportunity, matched }: { opportunity: Opportunity; matched: boolean }) {
  const [expanded, setExpanded] = React.useState(false)
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

      <div className="relative flex items-center justify-between gap-3 flex-wrap">
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

        {/* Real destination — the org's own careers/students page, never a
            fabricated per-posting URL. Omitted when there isn't one (the
            edugrants-run fellowship has no outside site to send you to). */}
        {opportunity.applyUrl && (
          <Button variant="accent" size="sm" asChild>
            <a href={opportunity.applyUrl} target="_blank" rel="noreferrer">
              Apply on {opportunity.org}'s site
              <ArrowUpRight size={13} strokeWidth={2} />
            </a>
          </Button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="relative overflow-hidden"
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
      <p className="relative font-sans text-[11px] text-dark-muted mt-4 pt-3 border-t border-white/8">
        In collaboration with <span className="text-dark-muted">edugrants</span>
      </p>
    </div>
  )
}
