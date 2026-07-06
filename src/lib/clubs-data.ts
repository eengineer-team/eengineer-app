import type { Discipline } from './community-data'

export interface JoinedClub {
  name: Discipline
  members: number
  /** Unread/new-activity count. Omit (or 0) when there's nothing new — no badge is shown. */
  unreadCount?: number
}

// Mock data — real-time membership/unread counts land once the Community
// backend exists (Phase 6). Shared between the Home landing widget and the
// sidebar "My Clubs" group so both read from one source.
export const JOINED_CLUBS: JoinedClub[] = [
  { name: 'Aerospace', members: 412, unreadCount: 3 },
  { name: 'Software', members: 968 },
  { name: 'Mechanical', members: 355, unreadCount: 1 },
]
