import * as React from 'react'
import { supabase } from '@/lib/supabase'
import * as api from '@/lib/api/notifications'
import type { NotificationRow } from '@/lib/api/notifications'

interface NotificationsContextValue {
  notifications: NotificationRow[]
  unreadCount: number
  markRead: (id: string) => void
  markAllRead: () => void
}

const NotificationsContext = React.createContext<NotificationsContextValue | null>(null)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = React.useState<NotificationRow[]>([])

  const refresh = React.useCallback(async () => {
    try {
      setNotifications(await api.fetchNotifications())
    } catch (err) {
      console.error('Failed to load notifications', err)
    }
  }, [])

  React.useEffect(() => {
    void refresh()
    // Deferred -- same supabase-js onAuthStateChange deadlock note as every
    // other context in this app: calling an auth method synchronously
    // inside this callback wedges the client.
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => void refresh(), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [refresh])

  // Realtime: a new webinar in your discipline should show up without a
  // manual refresh -- same recipe as QAFeed/messages-context (wait for the
  // session, setAuth, status callback, then subscribe).
  React.useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null
    let cancelled = false

    async function subscribe() {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token || cancelled) return
      supabase.realtime.setAuth(token)
      const uid = data.session!.user.id

      channel = supabase
        .channel(`notifications:${uid}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
          () => void refresh()
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('Notifications realtime channel', status)
          }
        })
    }

    void subscribe()
    return () => {
      cancelled = true
      if (channel) void supabase.removeChannel(channel)
    }
  }, [refresh])

  const markRead = React.useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    api.markNotificationRead(id).catch((err) => {
      console.error('Failed to mark notification read', err)
      void refresh()
    })
  }, [refresh])

  const markAllRead = React.useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    api.markAllNotificationsRead().catch((err) => {
      console.error('Failed to mark all notifications read', err)
      void refresh()
    })
  }, [refresh])

  const unreadCount = React.useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  const value = React.useMemo(
    () => ({ notifications, unreadCount, markRead, markAllRead }),
    [notifications, unreadCount, markRead, markAllRead]
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications() {
  const ctx = React.useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider')
  return ctx
}
