import * as React from 'react'
import { fetchCompetitions, type Competition } from '@/lib/api/competitions'
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

  const value = React.useMemo(
    () => ({ competitions, loading, getCompetition }),
    [competitions, loading, getCompetition]
  )

  return <CompetitionsContext.Provider value={value}>{children}</CompetitionsContext.Provider>
}

export function useCompetitions() {
  const ctx = React.useContext(CompetitionsContext)
  if (!ctx) throw new Error('useCompetitions must be used within CompetitionsProvider')
  return ctx
}
