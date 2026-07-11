import { SEED_COMPETITIONS } from '@/lib/calendar-data'
import { SEED_OPPORTUNITIES } from '@/lib/opportunities-data'

// Unifies Competitions (calendar-data.ts) and Opportunities (opportunities-data.ts)
// into one deadline shape so the Calendar's year/month views can count and
// place both kinds of listings on the same grid. Opportunities without a
// `deadlineDate` (genuinely rolling programs, e.g. IAESTE) are excluded --
// there's no single day to put them on, and showing a fake one would be
// exactly the kind of "verifiable lie" this app avoids elsewhere.
export interface DeadlineItem {
  id: string
  kind: 'competition' | 'opportunity'
  title: string
  org: string
  discipline: string
  location: string
  deadline: Date
  href: string
}

export function getAllDeadlines(): DeadlineItem[] {
  const fromCompetitions: DeadlineItem[] = SEED_COMPETITIONS.map((c) => ({
    id: c.id,
    kind: 'competition',
    title: c.name,
    org: c.organizer,
    discipline: c.discipline,
    location: c.remote ? 'Remote' : c.location,
    deadline: c.deadline,
    href: `/dashboard/competitions/${c.id}`,
  }))

  const fromOpportunities: DeadlineItem[] = SEED_OPPORTUNITIES.filter((o) => o.deadlineDate).map((o) => ({
    id: o.id,
    kind: 'opportunity',
    title: o.title,
    org: o.org,
    discipline: o.discipline,
    location: o.location,
    deadline: o.deadlineDate as Date,
    href: `/dashboard/opportunities/${o.id}`,
  }))

  return [...fromCompetitions, ...fromOpportunities]
}
