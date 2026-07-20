import * as React from 'react'
import { fetchOpportunities, type Opportunity } from '@/lib/api/opportunities'
import { supabase } from '@/lib/supabase'

// Read-only Supabase-backed store for the Opportunities feed — no writes in
// this domain (admin-managed content; opp_write is admin/super-admin only).
// `loading` must be checked before treating a missing id as "not found" —
// same lesson as profiles-context: opportunities load asynchronously, so on
// the very first render every id looks absent, and a detail page that
// redirects on absence would bounce the visitor mid-load.

interface OpportunitiesContextValue {
  opportunities: Opportunity[]
  loading: boolean
  getOpportunity: (id: string) => Opportunity | undefined
}

const OpportunitiesContext = React.createContext<OpportunitiesContextValue | null>(null)

export function OpportunitiesProvider({ children }: { children: React.ReactNode }) {
  const [opportunities, setOpportunities] = React.useState<Opportunity[]>([])
  const [loading, setLoading] = React.useState(true)

  const refresh = React.useCallback(async () => {
    try {
      setOpportunities(await fetchOpportunities())
    } catch (err) {
      // opp_select requires an authenticated Builder or preview session —
      // an anonymous fetch (e.g. this provider mounting on the public
      // Welcome page) is expected to fail RLS here; no page reads this
      // context pre-auth, so there's nothing more to do than log it.
      console.error('Failed to load opportunities', err)
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

  const getOpportunity = React.useCallback((id: string) => opportunities.find((o) => o.id === id), [opportunities])

  const value = React.useMemo(
    () => ({ opportunities, loading, getOpportunity }),
    [opportunities, loading, getOpportunity]
  )

  return <OpportunitiesContext.Provider value={value}>{children}</OpportunitiesContext.Provider>
}

export function useOpportunities() {
  const ctx = React.useContext(OpportunitiesContext)
  if (!ctx) throw new Error('useOpportunities must be used within OpportunitiesProvider')
  return ctx
}
