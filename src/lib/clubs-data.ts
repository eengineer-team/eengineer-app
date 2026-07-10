import type { Discipline } from './community-data'

export interface JoinedClub {
  name: Discipline
  members: number
  /** Unread/new-activity count. Omit (or 0) when there's nothing new — no badge is shown. */
  unreadCount?: number
}

// Mock data — real-time membership/unread counts land once the Community
// backend exists (Phase 6), and joining/leaving isn't wired up yet either.
// Shared between the Home landing widget and the sidebar "My Clubs" group so
// both read from one source. Starts empty — a fresh Builder hasn't joined
// anything; seeding this would show a stranger's clubs as their own.
export const JOINED_CLUBS: JoinedClub[] = []
