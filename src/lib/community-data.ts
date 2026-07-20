import type { Attachment } from '@/lib/attachments'

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
  authorId: string // 'me' for the signed-in Builder's own comment
  author: string
  text: string
  time?: string
}

export interface Question {
  id: string
  authorId: string // 'me' for the signed-in Builder's own question
  category: Discipline
  text: string
  author: string
  time: string
  approvals: number
  disapprovals: number
  myVote: 'approve' | 'disapprove' | null
  reported: boolean
  comments: Comment[]
}

export const SEED_QUESTIONS: Question[] = [
  {
    id: 'q1',
    authorId: 'n5',
    category: 'Aerospace',
    text: 'Has anyone tuned a PID controller for a model rocket active fin stabilizer? My response is oscillating way more than the sim predicted.',
    author: 'Alex Kim',
    time: '10:02 AM',
    approvals: 14,
    disapprovals: 0,
    myVote: null,
    reported: false,
    comments: [
      { id: 'c1', authorId: 'n2', author: 'Priya T.', text: 'Check your sensor sample rate first — that was my issue.', time: '10:07 AM' },
    ],
  },
  {
    id: 'q2',
    authorId: 'n1',
    category: 'Software',
    text: 'Best way to structure a monorepo for a school robotics team with both firmware and a dashboard web app?',
    author: 'Marcus R.',
    time: 'Yesterday',
    approvals: 9,
    disapprovals: 1,
    myVote: null,
    reported: false,
    comments: [],
  },
  {
    id: 'q3',
    authorId: 'n4',
    category: 'Mechanical',
    text: "What's a reasonable FOS (factor of safety) to target for a 3D-printed PLA bracket in a competition robot arm?",
    author: 'Sophie K.',
    time: 'Yesterday',
    approvals: 21,
    disapprovals: 2,
    myVote: null,
    reported: false,
    comments: [
      { id: 'c2', authorId: 'n5', author: 'Dev P.', text: 'PLA is brittle under repeated load — I\'d go 2.5-3x minimum.', time: 'Yesterday' },
      { id: 'c3', authorId: 'n3', author: 'James O.', text: 'Agreed, and watch layer orientation relative to load direction.', time: 'Yesterday' },
    ],
  },
  {
    id: 'q4',
    authorId: 'n3',
    category: 'Electrical',
    text: 'Any recommendations for a beginner-friendly current sensor for measuring brushless motor draw on a small drone?',
    author: 'James O.',
    time: 'Mon',
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
  /** ISO 8601 UTC instant — never a hand-typed weekday/date string. */
  startsAt: string
  attending: number
  registered: boolean
}

const WEBINAR_TIME_ZONE = 'America/New_York'

// Derives the weekday/date/time from the real instant instead of a
// hand-typed string, so it can never drift out of sync with the calendar.
export function formatWebinarDate(startsAt: string): string {
  const date = new Date(startsAt)
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short', timeZone: WEBINAR_TIME_ZONE })
  const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: WEBINAR_TIME_ZONE })
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: WEBINAR_TIME_ZONE,
    timeZoneName: 'short',
  })
  return `${weekday}, ${monthDay} · ${time}`
}

// Monthly, grouped by discipline — Community Lead organizes/finds speakers,
// this is schedule/announcement UI only, not a live-session tool.
export const SEED_WEBINARS: Webinar[] = [
  {
    id: 'w1',
    discipline: 'Aerospace',
    title: 'Aerospace Propulsion Systems',
    speaker: 'Dr. Elena Vasquez, JPL',
    startsAt: '2026-07-17T21:00:00Z',
    attending: 23,
    registered: false,
  },
  {
    id: 'w2',
    discipline: 'Software',
    title: 'Building Reliable Firmware-to-Cloud Pipelines',
    speaker: 'Marcus Chen, Software Lead @ Anduril',
    startsAt: '2026-07-21T22:00:00Z',
    attending: 41,
    registered: true,
  },
  {
    id: 'w3',
    discipline: 'Mechanical',
    title: 'Design for Additive Manufacturing',
    speaker: 'Rina Osei, Mechanical Engineer @ Boom Supersonic',
    startsAt: '2026-07-23T21:30:00Z',
    attending: 17,
    registered: false,
  },
  {
    id: 'w4',
    discipline: 'Electrical',
    title: 'Power Electronics for Small UAVs',
    speaker: 'Tomás Ferreira, EE @ Skydio',
    startsAt: '2026-08-03T22:00:00Z',
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

export interface Introduction {
  id: string
  authorId: string // 'me' for the signed-in Builder's own post
  name: string
  discipline: Discipline
  text: string
  time: string
  /** Optional photo/video/file attached to the intro — same shared
   *  Attachment type Messages uses (src/lib/attachments.ts). */
  attachment?: Attachment
}

// Self-intro feed, separate from the Members/connect list — introductions are
// posted content ("who I am, what I'm building, what I'm into"), not a
// connection-status row. No seed entry for authorId 'me': same honest-empty
// pattern as ProjectsHub's "hasMyProject" gate — the Builder sees a composer,
// not a fabricated post, until they actually write one.
export const SEED_INTRODUCTIONS: Introduction[] = [
  {
    id: 'i1',
    authorId: 'n1',
    name: 'Marcus R.',
    discipline: 'Software',
    text: "Hey! I'm Marcus — building the firmware + dashboard stack for my school's robotics team. Into monorepos, PID tuning, and bad puns. Always happy to talk software architecture.",
    time: '3d ago',
  },
  {
    id: 'i2',
    authorId: 'n2',
    name: 'Priya T.',
    discipline: 'Electrical',
    text: "Priya here, EE focused on power systems for small UAVs. Currently deep in a current-sensing rabbit hole. Looking to connect with anyone working on drone avionics.",
    time: '5d ago',
  },
  {
    id: 'i3',
    authorId: 'n4',
    name: 'Sophie K.',
    discipline: 'Mechanical',
    text: "Mechanical engineer, mostly 3D-printed competition robot parts. I geek out about factor-of-safety math more than is probably normal. Open to teaming up on FRC-style projects.",
    time: '1w ago',
  },
]

export interface Post {
  id: string
  authorId: string // 'me' for the signed-in Builder's own post
  name: string
  discipline: Discipline
  text: string
  time: string
  /** Optional photo/video/file attached to the post — same shared
   *  Attachment type Messages and Introduction use (src/lib/attachments.ts). */
  attachment?: Attachment
}

// Per-discipline discussion feed — a lightweight, running thread scoped to
// one discipline's Community group ("Discussion" tab in CommunityGroup.tsx),
// distinct from both the Q&A feed (structured questions with
// approve/disapprove voting) and Networking (one intro per person, editable
// in place). Posts here are just a chronological feed anyone can add to, no
// voting or single-post-per-person constraint. No seed entry for authorId
// 'me' — same honest-empty pattern as SEED_INTRODUCTIONS.
export const SEED_POSTS: Post[] = [
  {
    id: 'p1',
    authorId: 'n1',
    name: 'Marcus R.',
    discipline: 'Software',
    text: 'Pushed a small update to the monorepo template — build caching is way faster now. Screenshot of the before/after CI times attached.',
    time: '2d ago',
  },
  {
    id: 'p2',
    authorId: 'n3',
    name: 'James O.',
    discipline: 'Mechanical',
    text: "Anyone else's team going to the regional meet next month? Trying to coordinate a carpool from campus.",
    time: '4d ago',
  },
]
