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

export interface Webinar {
  id: string
  discipline: Discipline
  title: string
  speaker: string
  /** ISO 8601 UTC instant — never a hand-typed weekday/date string. */
  startsAt: string
  attending: number
  registered: boolean
  /** External Zoom/Meet link -- null until someone sets it via SQL/the
   *  internal panel. Not an in-browser video call (see Future of
   *  Eengineer.net doc, item 5 -- scoped down to timer + notification +
   *  external link rather than hosting calls ourselves). */
  meetingUrl: string | null
  durationMinutes: number
  /** One-line teaser/hook -- shown on the DashboardHome card in place of a
   *  bare title+date+Register block. Null falls back to a generic line. */
  description: string | null
}

/** True from starts_at until starts_at + durationMinutes. Used to switch
 *  the Register button to a Join link and to show a "Live now" badge. */
export function isWebinarLive(webinar: Pick<Webinar, 'startsAt' | 'durationMinutes'>): boolean {
  const start = new Date(webinar.startsAt).getTime()
  const now = Date.now()
  return now >= start && now < start + webinar.durationMinutes * 60_000
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
// voting or single-post-per-person constraint.
