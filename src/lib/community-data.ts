export const DISCIPLINES = [
  'Aerospace',
  'Mechanical',
  'Electrical',
  'Software',
  'Civil',
  'Chemical',
  'Biomedical',
  'Materials',
  'Environmental',
  'Other',
] as const
export type Discipline = (typeof DISCIPLINES)[number]

export function disciplineSlug(d: Discipline): string {
  return d.toLowerCase()
}

export function disciplineFromSlug(slug: string): Discipline | undefined {
  return DISCIPLINES.find((d) => disciplineSlug(d) === slug.toLowerCase())
}

export interface Comment {
  id: string
  author: string
  text: string
}

export interface Question {
  id: string
  category: Discipline
  text: string
  author: string
  approvals: number
  disapprovals: number
  myVote: 'approve' | 'disapprove' | null
  reported: boolean
  comments: Comment[]
}

export const SEED_QUESTIONS: Question[] = [
  {
    id: 'q1',
    category: 'Aerospace',
    text: 'Has anyone tuned a PID controller for a model rocket active fin stabilizer? My response is oscillating way more than the sim predicted.',
    author: 'Alex Kim',
    approvals: 14,
    disapprovals: 0,
    myVote: null,
    reported: false,
    comments: [
      { id: 'c1', author: 'Priya T.', text: 'Check your sensor sample rate first — that was my issue.' },
    ],
  },
  {
    id: 'q2',
    category: 'Software',
    text: 'Best way to structure a monorepo for a school robotics team with both firmware and a dashboard web app?',
    author: 'Marcus R.',
    approvals: 9,
    disapprovals: 1,
    myVote: null,
    reported: false,
    comments: [],
  },
  {
    id: 'q3',
    category: 'Mechanical',
    text: "What's a reasonable FOS (factor of safety) to target for a 3D-printed PLA bracket in a competition robot arm?",
    author: 'Sophie K.',
    approvals: 21,
    disapprovals: 2,
    myVote: null,
    reported: false,
    comments: [
      { id: 'c2', author: 'Dev P.', text: 'PLA is brittle under repeated load — I\'d go 2.5-3x minimum.' },
      { id: 'c3', author: 'James O.', text: 'Agreed, and watch layer orientation relative to load direction.' },
    ],
  },
  {
    id: 'q4',
    category: 'Electrical',
    text: 'Any recommendations for a beginner-friendly current sensor for measuring brushless motor draw on a small drone?',
    author: 'James O.',
    approvals: 6,
    disapprovals: 0,
    myVote: null,
    reported: false,
    comments: [],
  },
]

export interface Webinar {
  id: string
  discipline: Discipline
  title: string
  speaker: string
  date: string
  attending: number
  registered: boolean
}

// Monthly, grouped by discipline — Community Lead organizes/finds speakers,
// this is schedule/announcement UI only, not a live-session tool.
export const SEED_WEBINARS: Webinar[] = [
  {
    id: 'w1',
    discipline: 'Aerospace',
    title: 'Aerospace Propulsion Systems',
    speaker: 'Dr. Elena Vasquez, JPL',
    date: 'Fri, Jul 18 · 5:00 PM EST',
    attending: 23,
    registered: false,
  },
  {
    id: 'w2',
    discipline: 'Software',
    title: 'Building Reliable Firmware-to-Cloud Pipelines',
    speaker: 'Marcus Chen, Software Lead @ Anduril',
    date: 'Tue, Jul 22 · 6:00 PM EST',
    attending: 41,
    registered: true,
  },
  {
    id: 'w3',
    discipline: 'Mechanical',
    title: 'Design for Additive Manufacturing',
    speaker: 'Rina Osei, Mechanical Engineer @ Boom Supersonic',
    date: 'Thu, Jul 24 · 5:30 PM EST',
    attending: 17,
    registered: false,
  },
  {
    id: 'w4',
    discipline: 'Electrical',
    title: 'Power Electronics for Small UAVs',
    speaker: 'Tomás Ferreira, EE @ Skydio',
    date: 'Mon, Aug 4 · 6:00 PM EST',
    attending: 12,
    registered: false,
  },
]

export interface NetworkProfile {
  id: string
  name: string
  discipline: Discipline
  mutuals: number
  status: 'none' | 'requested' | 'incoming' | 'connected'
}

export const SEED_NETWORK: NetworkProfile[] = [
  { id: 'n1', name: 'Marcus R.', discipline: 'Software', mutuals: 6, status: 'none' },
  { id: 'n2', name: 'Priya T.', discipline: 'Electrical', mutuals: 11, status: 'incoming' },
  { id: 'n3', name: 'James O.', discipline: 'Mechanical', mutuals: 4, status: 'connected' },
  { id: 'n4', name: 'Sophie K.', discipline: 'Mechanical', mutuals: 3, status: 'none' },
  { id: 'n5', name: 'Dev P.', discipline: 'Civil', mutuals: 2, status: 'none' },
]
