import { DISCIPLINES, type Discipline } from '@/lib/community-data'

// Hub-card metadata for each discipline group — description/member count/
// recent-activity shown on the Community hub grid. Member counts reuse the
// same figures as the sidebar's Joined Clubs where a discipline overlaps
// (see clubs-data.ts); disciplines without an existing club get a plausible
// seed count until a real membership backend exists.
export interface CommunityGroupMeta {
  discipline: Discipline
  description: string
  memberCount: number
  /** New posts/replies in the last 7 days — 0 renders as "Quiet this week". */
  recentActivityCount: number
}

const META: Record<Discipline, Omit<CommunityGroupMeta, 'discipline'>> = {
  Aerospace: {
    description: 'Propulsion, aerodynamics, and flight control for student rockets and drones.',
    memberCount: 412,
    recentActivityCount: 6,
  },
  Mechanical: {
    description: 'CAD, FEA, and mechanism design for competition robots and machines.',
    memberCount: 355,
    recentActivityCount: 4,
  },
  Electrical: {
    description: 'Circuit design, power electronics, and sensor systems.',
    memberCount: 268,
    recentActivityCount: 2,
  },
  Software: {
    description: 'Firmware, dashboards, and the code that ties builds together.',
    memberCount: 968,
    recentActivityCount: 11,
  },
  Civil: {
    description: 'Structures, transportation, and infrastructure design.',
    memberCount: 141,
    recentActivityCount: 0,
  },
  Chemical: {
    description: 'Process design, materials synthesis, and reaction engineering.',
    memberCount: 97,
    recentActivityCount: 1,
  },
  Biomedical: {
    description: 'Medical devices, prosthetics, and biomechanics projects.',
    memberCount: 122,
    recentActivityCount: 3,
  },
  Materials: {
    description: 'Composites, additive manufacturing materials, and failure analysis.',
    memberCount: 84,
    recentActivityCount: 0,
  },
  Environmental: {
    description: 'Water systems, sustainability, and environmental impact engineering.',
    memberCount: 76,
    recentActivityCount: 1,
  },
  Other: {
    description: 'Anything engineering that doesn’t fit a single discipline above.',
    memberCount: 53,
    recentActivityCount: 0,
  },
}

export const COMMUNITY_GROUPS: CommunityGroupMeta[] = DISCIPLINES.map((discipline) => ({
  discipline,
  ...META[discipline],
}))
