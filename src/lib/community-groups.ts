import { DISCIPLINES, type Discipline } from '@/lib/community-data'

// Hub-card metadata for each discipline group — description/member count/
// recent-activity shown on the Community hub grid. Member counts reuse the
// same figures as the sidebar's Joined Clubs where a discipline overlaps
// (see clubs-data.ts); disciplines without an existing club get a plausible
// seed count until a real membership backend exists.
export interface LatestMessage {
  author: string
  text: string
  time: string
}

export interface CommunityGroupMeta {
  discipline: Discipline
  description: string
  memberCount: number
  /** New posts/replies in the last 7 days — 0 renders as "Quiet this week". */
  recentActivityCount: number
  /** Most recent message in the discipline's group chat — used by the Joined
   *  Clubs notification preview and the Community chat feed. */
  latestMessage: LatestMessage
}

const META: Record<Discipline, Omit<CommunityGroupMeta, 'discipline'>> = {
  Aerospace: {
    description: 'Propulsion, aerodynamics, and flight control for student rockets and drones.',
    memberCount: 412,
    recentActivityCount: 6,
    latestMessage: { author: 'Alex Kim', text: 'Has anyone tuned a PID controller for a model rocket active fin stabilizer?', time: '2h ago' },
  },
  Mechanical: {
    description: 'CAD, FEA, and mechanism design for competition robots and machines.',
    memberCount: 355,
    recentActivityCount: 4,
    latestMessage: { author: 'James O.', text: 'Cyclic bending on a robot arm joint, maybe 200 cycles a match.', time: '5h ago' },
  },
  Electrical: {
    description: 'Circuit design, power electronics, and sensor systems.',
    memberCount: 268,
    recentActivityCount: 2,
    latestMessage: { author: 'Priya T.', text: 'Any recommendations for a beginner-friendly current sensor for BLDC motors?', time: '1d ago' },
  },
  Software: {
    description: 'Firmware, dashboards, and the code that ties builds together.',
    memberCount: 968,
    recentActivityCount: 11,
    latestMessage: { author: 'Marcus R.', text: 'Best way to structure a monorepo for firmware + dashboard?', time: '20m ago' },
  },
  Civil: {
    description: 'Structures, transportation, and infrastructure design.',
    memberCount: 141,
    recentActivityCount: 0,
    latestMessage: { author: 'Dev P.', text: 'Anyone have grading/drainage reference calcs for a culvert design?', time: '3d ago' },
  },
  Chemical: {
    description: 'Process design, materials synthesis, and reaction engineering.',
    memberCount: 97,
    recentActivityCount: 1,
    latestMessage: { author: 'Nina W.', text: 'Looking for a reactor sizing sanity check on a batch process.', time: '2d ago' },
  },
  Biomedical: {
    description: 'Medical devices, prosthetics, and biomechanics projects.',
    memberCount: 122,
    recentActivityCount: 3,
    latestMessage: { author: 'Farah A.', text: 'Testing a low-cost prosthetic hand grip — feedback on the linkage?', time: '9h ago' },
  },
  Materials: {
    description: 'Composites, additive manufacturing materials, and failure analysis.',
    memberCount: 84,
    recentActivityCount: 0,
    latestMessage: { author: 'Owen T.', text: 'Layer adhesion failing on a carbon-fiber print — orientation tips?', time: '4d ago' },
  },
  Environmental: {
    description: 'Water systems, sustainability, and environmental impact engineering.',
    memberCount: 76,
    recentActivityCount: 1,
    latestMessage: { author: 'Maya L.', text: 'Anyone modeled small-scale greywater recycling for a school project?', time: '1d ago' },
  },
  Other: {
    description: 'Anything engineering that doesn’t fit a single discipline above.',
    memberCount: 53,
    recentActivityCount: 0,
    latestMessage: { author: 'Sam R.', text: 'Cross-posting since this spans a couple disciplines — thoughts welcome.', time: '6d ago' },
  },
}

export const COMMUNITY_GROUPS: CommunityGroupMeta[] = DISCIPLINES.map((discipline) => ({
  discipline,
  ...META[discipline],
}))

// Lookup used anywhere a discipline needs its hub-card info without pulling
// in the full list — e.g. the Joined Clubs widget (Home + sidebar), which
// only has the discipline name from clubs-data.ts and needs the description/
// activity that lives here instead of duplicating it.
export function getGroupMeta(discipline: Discipline): CommunityGroupMeta {
  return { discipline, ...META[discipline] }
}
