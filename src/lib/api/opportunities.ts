import { supabase } from '@/lib/supabase'
import type { Discipline } from '@/lib/community-data'

// Supabase-backed replacement for opportunities-data.ts's SEED_OPPORTUNITIES.
// opp_select is `app.is_builder() OR app.is_preview()` — authenticated role
// only, no anon policy — so this is fine to fetch for Builders and
// Google-preview but must never be read pre-auth (see LandingCalendar, which
// deliberately reads competitions instead).
//
// discipline is the enum and nullable in the DB: null means "open to all
// disciplines", not "unset" or "Other" — every consumer must render it via
// opportunityDisciplineLabel() rather than the raw value.

export interface Opportunity {
  id: string
  title: string
  org: string
  discipline: Discipline | null
  location: string
  remote: boolean
  description: string
  /** Hero image for the detail page. Absent for older/incomplete listings —
   *  consumers must render without an image block rather than a broken <img>. */
  image?: string
  requirements: string[]
  responsibilities: string[]
  source: string
  /** The org's real careers/students page. Omitted for the one edugrants-run
   *  fellowship, which has no outside site. */
  applyUrl?: string
  url?: string
  /** Real calendar date backing the deadline display — used by the Calendar's
   *  month/year views to place this listing on a specific day. Null for
   *  genuinely rolling programs (no single annual deadline). */
  deadlineDate: Date | null
  /** Human-readable deadline text ("Applications close Aug 31", "Rolling —
   *  apply each semester…"). Falls back to a date-derived string, or "Deadline
   *  TBA", if the row has no label — but every seeded row has one. */
  deadlineLabel: string
}

type OpportunityRow = {
  id: string
  title: string
  organization: string
  discipline: Discipline | null
  location: string
  remote: boolean
  description: string
  url: string | null
  deadline: string | null
  requirements: string[]
  responsibilities: string[]
  image_url: string | null
  apply_url: string | null
  source: string
  deadline_label: string | null
}

function formatDeadlineDate(d: Date): string {
  return `Deadline ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

function mapOpportunity(r: OpportunityRow): Opportunity {
  const deadlineDate = r.deadline ? new Date(r.deadline) : null
  return {
    id: r.id,
    title: r.title,
    org: r.organization,
    discipline: r.discipline,
    location: r.location,
    remote: r.remote,
    description: r.description,
    image: r.image_url ?? undefined,
    requirements: r.requirements,
    responsibilities: r.responsibilities,
    source: r.source,
    applyUrl: r.apply_url ?? undefined,
    url: r.url ?? undefined,
    deadlineDate,
    deadlineLabel: r.deadline_label ?? (deadlineDate ? formatDeadlineDate(deadlineDate) : 'Deadline TBA'),
  }
}

export async function fetchOpportunities(): Promise<Opportunity[]> {
  const { data, error } = await supabase.from('opportunities').select('*').order('created_at', { ascending: true })
  if (error) throw error
  return ((data ?? []) as unknown as OpportunityRow[]).map(mapOpportunity)
}

// null discipline means "open to all disciplines" — never render the raw
// value directly (it would show as blank).
export function opportunityDisciplineLabel(discipline: Discipline | null): string {
  return discipline ?? 'All disciplines'
}

// Rule-based matching: listings for the Builder's discipline (or open to all
// disciplines) sort first. Interim scorer — swap the sort key for a real ML
// match score once project-history data exists; the card shape and "Matched
// for you" badge don't need to change.
export function rankByDiscipline(opportunities: Opportunity[], discipline: Discipline | null): Opportunity[] {
  if (!discipline) return opportunities
  return [...opportunities].sort((a, b) => {
    const aMatch = a.discipline === discipline || a.discipline === null
    const bMatch = b.discipline === discipline || b.discipline === null
    if (aMatch === bMatch) return 0
    return aMatch ? -1 : 1
  })
}

export function isMatch(opportunity: Opportunity, discipline: Discipline | null): boolean {
  if (!discipline) return false
  return opportunity.discipline === discipline || opportunity.discipline === null
}
