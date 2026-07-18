import * as React from 'react'
import type { JoinedClub } from '@/lib/clubs-data'
import { supabase } from '@/lib/supabase'
import * as api from '@/lib/api/community'

// Shared club_memberships snapshot for the current Builder — JoinedClubs
// (sidebar/Home widget) and PeerActivity both read the same list so they
// can't disagree about which disciplines you've joined. No join/leave UI
// exists yet (see clubs-data.ts's old honest-empty comment), so this stays
// read-only for now; it just reflects whatever rows already exist.

interface ClubsContextValue {
  joinedClubs: JoinedClub[]
}

const ClubsContext = React.createContext<ClubsContextValue | null>(null)

export function ClubsProvider({ children }: { children: React.ReactNode }) {
  const [joinedClubs, setJoinedClubs] = React.useState<JoinedClub[]>([])

  const refresh = React.useCallback(async () => {
    const uid = await api.currentUid()
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
    const { data: sub } = supabase.auth.onAuthStateChange(() => void refresh())
    return () => sub.subscription.unsubscribe()
  }, [refresh])

  const value = React.useMemo(() => ({ joinedClubs }), [joinedClubs])

  return <ClubsContext.Provider value={value}>{children}</ClubsContext.Provider>
}

export function useJoinedClubs() {
  const ctx = React.useContext(ClubsContext)
  if (!ctx) throw new Error('useJoinedClubs must be used within ClubsProvider')
  return ctx
}
