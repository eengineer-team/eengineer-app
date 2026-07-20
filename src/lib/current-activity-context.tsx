import * as React from 'react'
import type { Discipline } from '@/lib/community-data'
import type { Attachment } from '@/lib/attachments'
import { supabase } from '@/lib/supabase'
import * as api from '@/lib/api/activity'
import type { ActivityUpdate } from '@/lib/api/activity'

// Supabase-backed "currently working on" feed -- see api/activity.ts for why
// this replaced the old localStorage mock. Append-only, many posts per
// Builder (unlike Project, which is one-per-Builder), matching
// discussion_posts's shape: no edit, own-delete only (plus staff, per the
// 20260722120000 migration).

export type { ActivityUpdate }

interface CurrentActivityContextValue {
  activity: ActivityUpdate[]
  loading: boolean
  post: (discipline: Discipline, text: string, attachment?: Attachment) => Promise<void>
  remove: (id: string) => Promise<void>
}

const CurrentActivityContext = React.createContext<CurrentActivityContextValue | null>(null)

export function CurrentActivityProvider({ children }: { children: React.ReactNode }) {
  const [activity, setActivity] = React.useState<ActivityUpdate[]>([])
  const [loading, setLoading] = React.useState(true)
  const uidRef = React.useRef<string | null>(null)

  const refresh = React.useCallback(async () => {
    uidRef.current = await api.currentUid()
    try {
      setActivity(await api.fetchActivity())
    } catch (err) {
      console.error('Failed to load the activity feed:', JSON.stringify(err, null, 2))
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void refresh()
    // Deferred with setTimeout: supabase-js holds an internal lock while
    // dispatching this callback, and refresh() calls an auth method, so
    // running it inline deadlocks the client (see clubs-context.tsx).
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => void refresh(), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [refresh])

  const post = React.useCallback(
    async (discipline: Discipline, text: string, attachment?: Attachment) => {
      const uid = uidRef.current
      const trimmed = text.trim()
      if (!uid || (!trimmed && !attachment)) return
      await api.postActivity(uid, discipline, trimmed, attachment)
      await refresh()
    },
    [refresh]
  )

  const remove = React.useCallback(
    async (id: string) => {
      const previous = activity
      setActivity((prev) => prev.filter((a) => a.id !== id))
      try {
        await api.deleteActivity(id)
      } catch (err) {
        setActivity(previous)
        throw err
      }
    },
    [activity]
  )

  const value = React.useMemo(
    () => ({ activity, loading, post, remove }),
    [activity, loading, post, remove]
  )

  return <CurrentActivityContext.Provider value={value}>{children}</CurrentActivityContext.Provider>
}

export function useCurrentActivity() {
  const ctx = React.useContext(CurrentActivityContext)
  if (!ctx) throw new Error('useCurrentActivity must be used within CurrentActivityProvider')
  return ctx
}
