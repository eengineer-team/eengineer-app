import * as React from 'react'
import { SEED_WEBINARS, type Webinar } from '@/lib/community-data'
import { usePersistentState } from '@/lib/use-persistent-state'

// Single source of truth for webinar RSVP state, shared by the dashboard
// home "Next webinar" card and the full Webinars list — registering in one
// place used to write to its own storage key, so the two screens disagreed
// about who was registered. Both now read/write through this context.

interface WebinarsContextValue {
  webinars: Webinar[]
  toggleRegistration: (id: string) => void
}

const WebinarsContext = React.createContext<WebinarsContextValue | null>(null)

export function WebinarsProvider({ children }: { children: React.ReactNode }) {
  const [webinars, setWebinars] = usePersistentState<Webinar[]>('ee:webinars', SEED_WEBINARS)

  const toggleRegistration = React.useCallback((id: string) => {
    setWebinars((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, registered: !w.registered, attending: w.attending + (w.registered ? -1 : 1) }
          : w
      )
    )
  }, [])

  const value = React.useMemo(() => ({ webinars, toggleRegistration }), [webinars, toggleRegistration])

  return <WebinarsContext.Provider value={value}>{children}</WebinarsContext.Provider>
}

export function useWebinars() {
  const ctx = React.useContext(WebinarsContext)
  if (!ctx) throw new Error('useWebinars must be used within WebinarsProvider')
  return ctx
}
