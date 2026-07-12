import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Building2, Clock, MapPin } from 'lucide-react'
import { getOpportunity } from '@/lib/opportunities-data'
import { Chip } from '@/components/ui/chip'
import { LabelCaps } from '@/components/ui/label-caps'
import { Button } from '@/components/ui/button'
import { getDisciplineColor } from '@/lib/discipline-colors'
import { cn } from '@/lib/utils'

// Full-page counterpart to OpportunityCard's "Explore" button — mirrors
// CompetitionDetail.tsx's shape (back-link, header banner, Overview section)
// but adds a hero image and both Requirements + Responsibilities, since an
// Opportunity carries both (a Competition only has Requirements).
export function OpportunityDetail() {
  const { id } = useParams<{ id: string }>()
  const opportunity = id ? getOpportunity(id) : undefined

  if (!opportunity) return <Navigate to="/dashboard/opportunities" replace />

  const color = getDisciplineColor(opportunity.discipline)

  return (
    <div className="flex-1 w-full px-8 py-8 max-w-[720px] mx-auto">
      <Link
        to="/dashboard/opportunities"
        className="inline-flex items-center gap-1.5 font-sans text-[0.8125rem] text-dark-muted hover:text-white/85 transition-colors mb-6"
      >
        <ArrowLeft size={13} strokeWidth={2} />
        Opportunities
      </Link>

      <div className={cn('relative overflow-hidden bg-dark-surface border border-white/10 border-t-2 rounded-lg mb-6', color.border)}>
        <div className="relative h-44 w-full overflow-hidden">
          <img
            src={opportunity.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-surface via-dark-surface/40 to-transparent" />
        </div>

        <div className="relative p-6 -mt-2">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="min-w-0">
              <h1 className="font-display text-[1.5rem] font-bold text-dark-text leading-tight">
                {opportunity.title}
              </h1>
              <p className="font-sans text-[0.8125rem] text-dark-muted mt-1 flex items-center gap-1.5">
                <Building2 size={13} strokeWidth={1.8} />
                {opportunity.org}
              </p>
            </div>
            <Chip theme="dashboard" discipline={opportunity.discipline} className="flex-shrink-0">
              {opportunity.discipline}
            </Chip>
          </div>

          <div className="flex items-center gap-4 mt-4 mb-5">
            <span className="flex items-center gap-1.5 font-sans text-[12px] text-white/60">
              <MapPin size={13} strokeWidth={1.8} />
              {opportunity.location}
            </span>
            <span className="flex items-center gap-1.5 font-sans text-[12px] text-gold-dark">
              <Clock size={13} strokeWidth={1.8} />
              {opportunity.deadline}
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-3">
            {/* Real destination — the org's own careers/students page, never a
                fabricated per-posting URL. Omitted when there isn't one (the
                edugrants-run fellowship has no outside site to send you to). */}
            {opportunity.applyUrl ? (
              <Button variant="accent" size="md" asChild>
                <a href={opportunity.applyUrl} target="_blank" rel="noreferrer">
                  Apply on {opportunity.org}'s site
                  <ArrowUpRight size={14} strokeWidth={2} />
                </a>
              </Button>
            ) : (
              <span className="font-sans text-[0.8125rem] text-dark-muted italic">
                Run directly by edugrants — applications open on the edugrants Foundation site.
              </span>
            )}
          </div>

          {/* Partner mark — same "In collaboration with edugrants" credit
              required on the card, promoted to a real logo here since this
              page is the canonical place to see full info about the listing.
              Kept in normal flow on its own row (not absolutely positioned)
              so it can never overlap the Apply button above it, no matter
              how long the button's label runs (e.g. long org names). */}
          <div className="flex items-center gap-2.5 mt-5 pt-4 border-t border-white/8">
            <img
              src="/edugrants-mark-dark-transparent.png"
              alt="edugrants"
              className="h-11 w-11 object-contain flex-shrink-0"
            />
            <span className="font-sans text-[12px] font-medium text-gold-dark">Partner: edugrants</span>
          </div>
        </div>
      </div>

      <section className="mb-6">
        <LabelCaps className="block mb-2">Overview</LabelCaps>
        <p className="font-sans text-[0.875rem] leading-[1.6] text-white/75">{opportunity.description}</p>
      </section>

      <section className="mb-6">
        <LabelCaps className="block mb-2">Requirements</LabelCaps>
        <ul className="flex flex-col gap-1.5">
          {opportunity.requirements.map((r, i) => (
            <li
              key={i}
              className="font-sans text-[0.8125rem] text-dark-muted leading-snug pl-3 relative before:content-['—'] before:absolute before:left-0 before:text-white/30"
            >
              {r}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <LabelCaps className="block mb-2">Responsibilities</LabelCaps>
        <ul className="flex flex-col gap-1.5">
          {opportunity.responsibilities.map((r, i) => (
            <li
              key={i}
              className="font-sans text-[0.8125rem] text-dark-muted leading-snug pl-3 relative before:content-['—'] before:absolute before:left-0 before:text-white/30"
            >
              {r}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
