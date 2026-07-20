import type { Competition } from '@/lib/api/competitions'
import { opportunityDisciplineLabel, type Opportunity } from '@/lib/api/opportunities'

// Unifies Competitions and Opportunities into one deadline shape so the
// Calendar's year/month views can count and place both kinds of listings on
// the same grid. Takes the live arrays from CompetitionsProvider/
// OpportunitiesProvider (rather than reading SEED_ constants) so callers
// control which data is loaded — CalendarMonthView/CalendarYearView pull
// both; CompetitionCalendar/LandingCalendar only need competitions and skip
// this entirely. Opportunities without a `deadlineDate` (genuinely rolling
// programs, e.g. IAESTE) are excluded — there's no single day to put them
// on, and showing a fake one would be exactly the kind of "verifiable lie"
// this app avoids elsewhere.
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

export function getAllDeadlines(competitions: Competition[], opportunities: Opportunity[]): DeadlineItem[] {
  const fromCompetitions: DeadlineItem[] = competitions.map((c) => ({
    id: c.id,
    kind: 'competition',
    title: c.name,
    org: c.organizer,
    discipline: c.discipline,
    location: c.remote ? 'Remote' : c.location,
    deadline: c.deadline,
    href: `/dashboard/competitions/${c.id}`,
  }))

  const fromOpportunities: DeadlineItem[] = opportunities
    .filter((o) => o.deadlineDate)
    .map((o) => ({
      id: o.id,
      kind: 'opportunity',
      title: o.title,
      org: o.org,
      discipline: opportunityDisciplineLabel(o.discipline),
      location: o.location,
      deadline: o.deadlineDate as Date,
      href: `/dashboard/opportunities/${o.id}`,
    }))

  return [...fromCompetitions, ...fromOpportunities]
}
