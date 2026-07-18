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
