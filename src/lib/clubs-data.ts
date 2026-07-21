import type { Discipline } from './community-data'

export interface JoinedClub {
  name: Discipline
  /** Unread/new-activity count. Omit (or 0) when there's nothing new — no badge is shown. */
  unreadCount?: number
}

