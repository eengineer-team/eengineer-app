import { DISCIPLINES, type Discipline } from '@/lib/community-data'

// Hub-card metadata for each discipline group — just the curated description
// shown on the Community hub grid. Member counts, recent-activity counts, and
// the latest-message preview used to live here too as hardcoded fake numbers
// (e.g. "412 members", invented quotes from invented people) — those are now
// computed for real from the database via community-stats-context.tsx
// (backed by the community_group_stats view + fetchLatestGroupMessages), so
// they've been removed from here rather than left as unused dead data.
export interface CommunityGroupMeta {
  discipline: Discipline
  description: string
}

const DESCRIPTIONS: Record<Discipline, string> = {
  Aerospace: 'Propulsion, aerodynamics, and flight control for student rockets and drones.',
  Mechanical: 'CAD, FEA, and mechanism design for competition robots and machines.',
  Electrical: 'Circuit design, power electronics, and sensor systems.',
  Software: 'Firmware, dashboards, and the code that ties builds together.',
  Civil: 'Structures, transportation, and infrastructure design.',
  Chemical: 'Process design, materials synthesis, and reaction engineering.',
  Biomedical: 'Medical devices, prosthetics, and biomechanics projects.',
  Materials: 'Composites, additive manufacturing materials, and failure analysis.',
  Environmental: 'Water systems, sustainability, and environmental impact engineering.',
  Other: 'Anything engineering that doesn’t fit a single discipline above.',
}

export const COMMUNITY_GROUPS: CommunityGroupMeta[] = DISCIPLINES.map((discipline) => ({
  discipline,
  description: DESCRIPTIONS[discipline],
}))

// Lookup used anywhere a discipline needs its hub-card description without
// pulling in the full list — e.g. the Joined Clubs widget (Home + sidebar).
export function getGroupMeta(discipline: Discipline): CommunityGroupMeta {
  return { discipline, description: DESCRIPTIONS[discipline] }
}
