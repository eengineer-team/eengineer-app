import { ME_ID } from '@/lib/profile-data'

// Step "Projects" — a Builder's own venture/team project, distinct from the
// portfolio-style ProjectEntry[] already living on BuilderProfile (that's
// past work; this is a live, ongoing thing you're building and recruiting
// for). One Project per Builder — same 1:1 shape as ProfileDetail's "own
// profile" pattern, same mock-in-memory caveat as the rest of the app.

export type ProjectKind = 'telegram' | 'website' | 'other'

export const PROJECT_KIND_LABEL: Record<ProjectKind, string> = {
  telegram: 'Telegram channel',
  website: 'Website',
  other: 'Other',
}

// Placeholder copy for the stat-row inputs, tuned per project type — matches
// the PDF spec ("if it's a Telegram channel -> channel stats, if it's a
// website -> site stats") without hardcoding which stats exist, since that
// varies project to project.
export const PROJECT_KIND_STAT_HINT: Record<ProjectKind, string> = {
  telegram: 'e.g. Subscribers, Avg. views per post',
  website: 'e.g. Monthly visitors, Signups',
  other: 'e.g. any number worth showing off',
}

export interface ProjectStat {
  id: string
  label: string
  value: string
}

export interface SupportingMaterial {
  id: string
  label: string
  url: string
}

export interface TeamMember {
  id: string
  name: string
  role: string
}

export interface ProjectFeedback {
  id: string
  fromName: string
  text: string
}

export interface Project {
  id: string
  /** BuilderProfile id this project belongs to — one project per Builder. */
  ownerId: string
  name: string
  description: string
  kind: ProjectKind
  thumbnailUrl?: string
  coverUrl?: string
  link?: string
  telegramUrl?: string
  instagramUrl?: string
  stats: ProjectStat[]
  supportingMaterials: SupportingMaterial[]
  openToRecruitment: boolean
  team: TeamMember[]
  /** Names of people who've asked to join — owner-visible signal, no
   *  accept/decline backend yet (same caveat as the rest of the app). */
  joinRequests: string[]
  /** Profile ids following this project — 'me' toggles itself in/out. */
  followerIds: string[]
  feedback: ProjectFeedback[]
}

export const ME_PROJECT_ID = 'proj-me'

export const SEED_PROJECTS: Project[] = [
  {
    id: ME_PROJECT_ID,
    ownerId: ME_ID,
    name: '',
    description: '',
    kind: 'other',
    stats: [],
    supportingMaterials: [],
    openToRecruitment: false,
    team: [],
    joinRequests: [],
    followerIds: [],
    feedback: [],
  },
  {
    id: 'proj-alex',
    ownerId: 'n-alex',
    name: 'Rocket Propulsion Simulator',
    description:
      'A 6-DOF simulator for solid-fuel model rocket flight, used to tune an active fin stabilizer PID loop before bench testing. Open-sourcing it so other teams can skip the bench-testing guesswork.',
    kind: 'website',
    link: 'https://github.com/alexkim/rocket-sim',
    stats: [
      { id: 's1', label: 'GitHub stars', value: '142' },
      { id: 's2', label: 'Forks', value: '23' },
    ],
    supportingMaterials: [
      { id: 'm1', label: 'Design doc', url: 'https://docs.google.com/document/d/rocket-sim-prd' },
    ],
    openToRecruitment: true,
    team: [
      { id: 't1', name: 'Alex Kim', role: 'Lead / Controls' },
    ],
    joinRequests: [],
    followerIds: ['n1', 'n3'],
    feedback: [
      { id: 'f1', fromName: 'James O.', text: 'Used this to validate my own fin controller — saved me a week of bench testing.' },
    ],
  },
  {
    id: 'proj-marcus',
    ownerId: 'n1',
    name: 'Robotics Monorepo Template',
    description:
      'A monorepo layout for school robotics teams pairing embedded firmware with a live telemetry dashboard. Looking for a firmware person to help generalize the CAN bus layer.',
    kind: 'website',
    link: 'https://github.com/marcusr/robotics-monorepo',
    telegramUrl: 'https://t.me/roboticsmonorepo',
    stats: [
      { id: 's3', label: 'GitHub stars', value: '89' },
    ],
    supportingMaterials: [],
    openToRecruitment: true,
    team: [
      { id: 't2', name: 'Marcus R.', role: 'Maintainer' },
    ],
    joinRequests: [],
    followerIds: ['n-alex'],
    feedback: [],
  },
]
