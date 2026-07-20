import * as React from 'react'
import type { Webinar } from '@/lib/community-data'
import { supabase } from '@/lib/supabase'
import * as api from '@/lib/api/community'

// Single source of truth for webinar RSVP state, shared by the dashboard
// home "Next webinar" card and the full Webinars list — registering in one
// place used to write to its own storage key, so the two screens disagreed
// about who was registered. Both now read/write through this context, which
// is now Supabase-backed: `attending` = count(webinar_rsvps), `registered` =
// an rsvp exists for auth.uid().

interface WebinarsContextValue {
  webinars: Webinar[]
  toggleRegistration: (id: string) => void
}

const WebinarsContext = React.createContext<WebinarsContextValue | null>(null)

export function WebinarsProvider({ children }: { children: React.ReactNode }) {
  const [webinars, setWebinars] = React.useState<Webinar[]>([])
  const uidRef = React.useRef<string | null>(null)

  const refresh = React.useCallback(async () => {
    uidRef.current = await api.currentUid()
    try {
      setWebinars(await api.fetchWebinars())
    } catch (err) {
      console.error('Failed to load webinars', err)
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

  const toggleRegistration = React.useCallback(
    (id: string) => {
      const uid = uidRef.current
      if (!uid) return
      const target = webinars.find((w) => w.id === id)
      if (!target) return
      const wasRegistered = target.registered

      setWebinars((prev) =>
        prev.map((w) =>
          w.id === id
            ? { ...w, registered: !w.registered, attending: w.attending + (w.registered ? -1 : 1) }
            : w
        )
      )
      api.toggleWebinarRegistration(uid, id, wasRegistered).catch((err) => {
        console.error('RSVP toggle failed', err)
        void refresh()
      })
    },
    [webinars, refresh]
  )

  const value = React.useMemo(() => ({ webinars, toggleRegistration }), [webinars, toggleRegistration])

  return <WebinarsContext.Provider value={value}>{children}</WebinarsContext.Provider>
}

export function useWebinars() {
  const ctx = React.useContext(WebinarsContext)
  if (!ctx) throw new Error('useWebinars must be used within WebinarsProvider')
  return ctx
}
