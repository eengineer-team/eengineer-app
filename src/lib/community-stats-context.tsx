import * as React from 'react'
import type { Discipline } from '@/lib/community-data'
import { supabase } from '@/lib/supabase'
import * as api from '@/lib/api/community'
import type { CommunityGroupStats, LatestGroupMessage } from '@/lib/api/community'

// Live replacement for the hardcoded numbers that used to live in
// community-groups.ts ("412 members", "6 new this week", invented latest-
// message quotes). Backed by the community_group_stats view (real counts
// from club_memberships / questions / discussion_posts / introductions /
// activity_updates) and fetchLatestGroupMessages (real discussion_posts
// rows). Refetches on auth change since the underlying tables' RLS makes
// anon vs. authenticated see different rows (anon safely gets zeros).

interface CommunityStatsContextValue {
  getStats: (discipline: Discipline) => CommunityGroupStats
  getLatestMessage: (discipline: Discipline) => LatestGroupMessage | undefined
}

const EMPTY_STATS: CommunityGroupStats = { memberCount: 0, recentActivityCount: 0 }

const CommunityStatsContext = React.createContext<CommunityStatsContextValue | null>(null)

export function CommunityStatsProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = React.useState<Record<string, CommunityGroupStats>>({})
  const [latestMessages, setLatestMessages] = React.useState<Partial<Record<Discipline, LatestGroupMessage>>>({})

  const refresh = React.useCallback(async () => {
    try {
      const [statsResult, messagesResult] = await Promise.all([
        api.fetchCommunityGroupStats(),
        api.fetchLatestGroupMessages(),
      ])
      setStats(statsResult)
      setLatestMessages(messagesResult)
    } catch (err) {
      console.error('Failed to load community group stats', err)
    }
  }, [])

  React.useEffect(() => {
    void refresh()
    // Deferred — see the note in clubs-context.tsx: calling an auth method
    // inline inside this callback deadlocks supabase-js's internal lock.
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => void refresh(), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [refresh])

  const getStats = React.useCallback(
    (discipline: Discipline) => stats[discipline] ?? EMPTY_STATS,
    [stats]
  )

  const getLatestMessage = React.useCallback(
    (discipline: Discipline) => latestMessages[discipline],
    [latestMessages]
  )

  const value = React.useMemo(() => ({ getStats, getLatestMessage }), [getStats, getLatestMessage])

  return <CommunityStatsContext.Provider value={value}>{children}</CommunityStatsContext.Provider>
}

export function useCommunityStats() {
  const ctx = React.useContext(CommunityStatsContext)
  if (!ctx) throw new Error('useCommunityStats must be used within CommunityStatsProvider')
  return ctx
}
