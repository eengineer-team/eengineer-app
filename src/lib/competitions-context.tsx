import * as React from 'react'
import {
  fetchCompetitions,
  registerForCompetition,
  unregisterFromCompetition,
  currentUid,
  type Competition,
  type CompetitionRegistration,
} from '@/lib/api/competitions'
import { supabase } from '@/lib/supabase'

// Read-only Supabase-backed store for competitions — no writes in this
// domain (admin-managed content; comp_write is admin/super-admin only).
// Deliberately mounted above the router (see App.tsx, same level as
// ProfilesProvider) rather than only inside /dashboard: LandingCalendar
// reads this on the public, pre-auth Welcome page, and comp_select_public
// (see the 20260720130000 migration) makes that anon read succeed.
// `loading` must be checked before treating a missing id as "not found" —
// same lesson as profiles-context.

interface CompetitionsContextValue {
  competitions: Competition[]
  loading: boolean
  getCompetition: (id: string) => Competition | undefined
  register: (competitionId: string, reg: CompetitionRegistration) => Promise<void>
  unregister: (competitionId: string) => Promise<void>
}

const CompetitionsContext = React.createContext<CompetitionsContextValue | null>(null)

export function CompetitionsProvider({ children }: { children: React.ReactNode }) {
  const [competitions, setCompetitions] = React.useState<Competition[]>([])
  const [loading, setLoading] = React.useState(true)

  const refresh = React.useCallback(async () => {
    try {
      setCompetitions(await fetchCompetitions())
    } catch (err) {
      console.error('Failed to load competitions', err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void refresh()
    // Deferred — see the note in clubs-context.tsx.
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => void refresh(), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [refresh])

  const getCompetition = React.useCallback((id: string) => competitions.find((c) => c.id === id), [competitions])

  // Real write, unlike the rest of this domain -- registration is
  // per-Builder, not admin-managed content. Re-fetches on success/failure
  // rather than patching local state optimistically: registering also
  // fires the organizer-notification Edge Function, so waiting for the DB
  // round-trip to actually confirm the row exists is worth the small delay.
  const register = React.useCallback(
    async (competitionId: string, reg: CompetitionRegistration) => {
      const uid = await currentUid()
      if (!uid) throw new Error('No active session.')
      await registerForCompetition(uid, competitionId, reg)
      await refresh()
    },
    [refresh]
  )

  const unregister = React.useCallback(
    async (competitionId: string) => {
      const uid = await currentUid()
      if (!uid) throw new Error('No active session.')
      await unregisterFromCompetition(uid, competitionId)
      await refresh()
    },
    [refresh]
  )

  const value = React.useMemo(
    () => ({ competitions, loading, getCompetition, register, unregister }),
    [competitions, loading, getCompetition, register, unregister]
  )

  return <CompetitionsContext.Provider value={value}>{children}</CompetitionsContext.Provider>
}

export function useCompetitions() {
  const ctx = React.useContext(CompetitionsContext)
  if (!ctx) throw new Error('useCompetitions must be used within CompetitionsProvider')
  return ctx
}
