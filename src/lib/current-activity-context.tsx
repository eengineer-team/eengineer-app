import * as React from 'react'
import { ME_ID } from '@/lib/profile-data'
import { SEED_CURRENT_ACTIVITY, type CurrentActivity } from '@/lib/current-activity-data'
import type { Discipline } from '@/lib/community-data'
import type { Attachment } from '@/lib/attachments'
import { usePersistentState } from '@/lib/use-persistent-state'

// In-memory "currently working on" feed — same mock-store caveat as the rest
// of the app (see PROGRESS.md). Anyone can post any number of updates (unlike
// Project, which is one-per-Builder), so this is a straight append-only feed
// rather than an "own row" pattern.

interface CurrentActivityContextValue {
  activity: CurrentActivity[]
  post: (name: string, discipline: Discipline, text: string, attachment?: Attachment) => void
  remove: (id: string) => void
}

const CurrentActivityContext = React.createContext<CurrentActivityContextValue | null>(null)

export function CurrentActivityProvider({ children }: { children: React.ReactNode }) {
  const [activity, setActivity] = usePersistentState<CurrentActivity[]>(
    'ee:current-activity',
    SEED_CURRENT_ACTIVITY
  )

  const post = React.useCallback(
    (name: string, discipline: Discipline, text: string, attachment?: Attachment) => {
      const trimmed = text.trim()
      if (!trimmed && !attachment) return
      setActivity((prev) => [
        {
          id: `ca-${Date.now()}`,
          authorId: ME_ID,
          name,
          discipline,
          text: trimmed,
          time: 'Just now',
          attachment,
        },
        ...prev,
      ])
    },
    []
  )

  const remove = React.useCallback((id: string) => {
    setActivity((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const value = React.useMemo(() => ({ activity, post, remove }), [activity, post, remove])

  return <CurrentActivityContext.Provider value={value}>{children}</CurrentActivityContext.Provider>
}

export function useCurrentActivity() {
  const ctx = React.useContext(CurrentActivityContext)
  if (!ctx) throw new Error('useCurrentActivity must be used within CurrentActivityProvider')
  return ctx
}
