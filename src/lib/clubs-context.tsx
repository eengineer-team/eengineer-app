import * as React from 'react'
import type { Discipline } from '@/lib/community-data'
import type { JoinedClub } from '@/lib/clubs-data'
import { getGroupMeta } from '@/lib/community-groups'
import { supabase } from '@/lib/supabase'
import * as api from '@/lib/api/community'

// Shared club_memberships snapshot for the current Builder — JoinedClubs
// (sidebar/Home widget), PeerActivity, and the Join/Leave controls on
// CommunityHub/CommunityGroup all read and write through this one context so
// they can't disagree about which disciplines you've joined. Optimistic
// then reconciled, same recipe as profiles-context's updateMe.

interface ClubsContextValue {
  joinedClubs: JoinedClub[]
  isJoined: (discipline: Discipline) => boolean
  join: (discipline: Discipline) => Promise<void>
  leave: (discipline: Discipline) => Promise<void>
}

const ClubsContext = React.createContext<ClubsContextValue | null>(null)

export function ClubsProvider({ children }: { children: React.ReactNode }) {
  const [joinedClubs, setJoinedClubs] = React.useState<JoinedClub[]>([])
  const uidRef = React.useRef<string | null>(null)

  const refresh = React.useCallback(async () => {
    uidRef.current = await api.currentUid()
    const uid = uidRef.current
    if (!uid) {
      setJoinedClubs([])
      return
    }
    try {
      setJoinedClubs(await api.fetchJoinedClubs(uid))
    } catch (err) {
      console.error('Failed to load joined clubs', err)
    }
  }, [])

  React.useEffect(() => {
    void refresh()
    // Deferred with setTimeout: supabase-js holds an internal lock while it
    // dispatches this callback, and refresh() calls an auth method, so running
    // it inline deadlocks the client and later requests never leave the browser.
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => void refresh(), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [refresh])

  const isJoined = React.useCallback(
    (discipline: Discipline) => joinedClubs.some((c) => c.name === discipline),
    [joinedClubs]
  )

  // Optimistic, then reconciled — rethrows on failure (rather than just
  // console.error) so the caller can show a visible error instead of the
  // change silently reverting with no explanation.
  const join = React.useCallback(
    async (discipline: Discipline) => {
      const uid = uidRef.current
      if (!uid) return
      const previous = joinedClubs
      setJoinedClubs((prev) =>
        prev.some((c) => c.name === discipline) ? prev : [...prev, { name: discipline, members: getGroupMeta(discipline).memberCount }]
      )
      try {
        await api.joinClub(uid, discipline)
      } catch (err) {
        setJoinedClubs(previous)
        throw err
      }
    },
    [joinedClubs]
  )

  const leave = React.useCallback(
    async (discipline: Discipline) => {
      const uid = uidRef.current
      if (!uid) return
      const previous = joinedClubs
      setJoinedClubs((prev) => prev.filter((c) => c.name !== discipline))
      try {
        await api.leaveClub(uid, discipline)
      } catch (err) {
        setJoinedClubs(previous)
        throw err
      }
    },
    [joinedClubs]
  )

  const value = React.useMemo(
    () => ({ joinedClubs, isJoined, join, leave }),
    [joinedClubs, isJoined, join, leave]
  )

  return <ClubsContext.Provider value={value}>{children}</ClubsContext.Provider>
}

export function useJoinedClubs() {
  const ctx = React.useContext(ClubsContext)
  if (!ctx) throw new Error('useJoinedClubs must be used within ClubsProvider')
  return ctx
}
