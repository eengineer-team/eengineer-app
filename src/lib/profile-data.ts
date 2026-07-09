import type { Discipline } from '@/lib/community-data'

// Step 9 — Profiles. Everything here is in-memory mock state (see
// profiles-context.tsx) until a real backend/user-directory exists — same
// caveat as auth-context.tsx's mock OAuth. Card shape is designed so a real
// API can swap in without touching the UI.

export interface Skill {
  name: string
  proficiency: number // 1–5, self-rated
}

export interface ProjectEntry {
  id: string
  title: string
  year: number
  description: string
  image?: string
  video?: string
  skillNames: string[] // ties a project to the skills it demonstrates
}

export interface Endorsement {
  id: string
  fromName: string
  targetType: 'skill' | 'project'
  targetName: string
  reason: string // mandatory per spec — never optional
}

export interface ExperienceEntry {
  id: string
  role: string
  organization: string
  duration: string // free text — "Summer 2025", "2024–Present", etc.
  description: string
}

export interface BackgroundPreset {
  id: string
  label: string
  className: string
}

// Token-based only — no raw hex. Each preset is a subtle tint over
// dark.surface using the existing gold-dark / corn-700 accents.
export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { id: 'slate', label: 'Slate', className: 'bg-dark-surface' },
  { id: 'gold', label: 'Gold', className: 'bg-gradient-to-br from-gold-dark/20 via-dark-surface to-dark-surface' },
  { id: 'corn', label: 'Amber', className: 'bg-gradient-to-br from-corn-700/25 via-dark-surface to-dark-surface' },
  { id: 'deep', label: 'Deep', className: 'bg-gradient-to-br from-dark-surface2 via-dark-surface to-dark-900' },
]

export interface BuilderProfile {
  id: string
  name: string
  discipline: Discipline
  online: boolean
  bio: string
  backgroundId: string
  /** Data URL or hosted image — falls back to initials in <Avatar> until set. */
  avatarUrl?: string
  skills: Skill[]
  projects: ProjectEntry[]
  experience: ExperienceEntry[]
  endorsements: Endorsement[]
  /** OAuth verification links — trust signal per spec, not a data source. */
  githubUrl?: string
  linkedinUrl?: string
  /** Mutual connections with the viewer — not shown on your own profile. */
  mutuals: number
  connectStatus: 'none' | 'requested' | 'connected'
  /** Set during onboarding (Step 13) — surfaced as a badge on the profile. */
  openToWork: boolean
  interests: string[]
}

// Fixed id for whoever is currently signed in — the only profile the
// session can edit. Real name comes from auth-context at render time.
export const ME_ID = 'me'

export const SEED_PROFILES: BuilderProfile[] = [
  {
    id: ME_ID,
    name: 'You',
    discipline: 'Aerospace',
    online: true,
    bio: 'Add a short bio so other Builders know what you’re working on.',
    backgroundId: 'slate',
    skills: [
      { name: 'CAD (SolidWorks)', proficiency: 3 },
      { name: 'Python', proficiency: 4 },
    ],
    projects: [],
    experience: [],
    endorsements: [],
    mutuals: 0,
    connectStatus: 'none',
    openToWork: false,
    interests: [],
  },
  {
    id: 'n-alex',
    name: 'Alex Kim',
    discipline: 'Aerospace',
    online: true,
    bio: 'Building propulsion and control systems for model rockets. JPL internship, summer 2025.',
    backgroundId: 'gold',
    githubUrl: 'https://github.com/alexkim',
    linkedinUrl: 'https://linkedin.com/in/alexkim',
    skills: [
      { name: 'CFD Analysis', proficiency: 4 },
      { name: 'MATLAB', proficiency: 5 },
      { name: 'SolidWorks', proficiency: 4 },
    ],
    projects: [
      {
        id: 'p-alex-1',
        title: 'Rocket Propulsion Simulator',
        year: 2025,
        description:
          'A 6-DOF simulator for solid-fuel model rocket flight, used to tune an active fin stabilizer PID loop before bench testing.',
        skillNames: ['MATLAB', 'CFD Analysis'],
      },
      {
        id: 'p-alex-2',
        title: 'Airfoil Optimization Tool',
        year: 2024,
        description: 'Gradient-free optimizer sweeping airfoil geometry against a panel-method lift/drag solver.',
        skillNames: ['MATLAB'],
      },
    ],
    experience: [
      {
        id: 'x-alex-1',
        role: 'Propulsion Intern',
        organization: 'JPL',
        duration: 'Summer 2025',
        description: 'Supported active fin stabilizer testing for a small solid-fuel rocket program.',
      },
    ],
    endorsements: [
      { id: 'e1', fromName: 'Priya T.', targetType: 'skill', targetName: 'MATLAB', reason: 'Walked me through vectorizing a solver that used to take 40 minutes — down to 8 seconds.' },
    ],
    mutuals: 8,
    connectStatus: 'connected',
    openToWork: true,
    interests: ['Rocketry', 'Flight controls', 'CFD'],
  },
  {
    id: 'n1',
    name: 'Marcus R.',
    discipline: 'Software',
    online: false,
    bio: 'Robotics team lead. Firmware and dashboards for competition robots.',
    backgroundId: 'corn',
    githubUrl: 'https://github.com/marcusr',
    skills: [
      { name: 'C++', proficiency: 4 },
      { name: 'React', proficiency: 3 },
    ],
    projects: [
      {
        id: 'p-marcus-1',
        title: 'Robotics Monorepo Template',
        year: 2025,
        description: 'A monorepo layout for school robotics teams pairing embedded firmware with a live telemetry dashboard.',
        skillNames: ['C++', 'React'],
      },
    ],
    experience: [],
    endorsements: [],
    mutuals: 6,
    connectStatus: 'none',
    openToWork: false,
    interests: ['Robotics', 'Embedded systems'],
  },
  {
    id: 'n2',
    name: 'Priya T.',
    discipline: 'Electrical',
    online: true,
    bio: 'Power electronics and sensor fusion. Currently obsessed with current sensing on small drones.',
    backgroundId: 'deep',
    linkedinUrl: 'https://linkedin.com/in/priyat',
    skills: [
      { name: 'Circuit Design', proficiency: 4 },
      { name: 'MATLAB', proficiency: 3 },
    ],
    projects: [],
    experience: [],
    endorsements: [],
    mutuals: 11,
    connectStatus: 'requested',
    openToWork: true,
    interests: ['Power electronics', 'Drones'],
  },
  {
    id: 'n3',
    name: 'James O.',
    discipline: 'Mechanical',
    online: false,
    bio: 'Competition robot arms, FOS calculations, and way too many PLA prints.',
    backgroundId: 'slate',
    skills: [
      { name: 'FEA', proficiency: 3 },
      { name: '3D Printing', proficiency: 5 },
    ],
    projects: [],
    experience: [],
    endorsements: [],
    mutuals: 4,
    connectStatus: 'connected',
    openToWork: false,
    interests: ['Robot arms', '3D printing'],
  },
  {
    id: 'n4',
    name: 'Sophie K.',
    discipline: 'Mechanical',
    online: true,
    bio: 'Structures and mechanisms. Bracket design for competition robot arms.',
    backgroundId: 'gold',
    githubUrl: 'https://github.com/sophiek',
    linkedinUrl: 'https://linkedin.com/in/sophiek',
    skills: [
      { name: 'SolidWorks', proficiency: 4 },
      { name: 'GD&T', proficiency: 3 },
    ],
    projects: [],
    experience: [],
    endorsements: [],
    mutuals: 3,
    connectStatus: 'none',
    openToWork: false,
    interests: ['Structures'],
  },
  {
    id: 'n5',
    name: 'Dev P.',
    discipline: 'Civil',
    online: false,
    bio: 'Interested in transportation infrastructure and grading/drainage design.',
    backgroundId: 'corn',
    skills: [
      { name: 'AutoCAD Civil 3D', proficiency: 3 },
    ],
    projects: [],
    experience: [],
    endorsements: [],
    mutuals: 2,
    connectStatus: 'none',
    openToWork: false,
    interests: ['Transportation infrastructure'],
  },
]
