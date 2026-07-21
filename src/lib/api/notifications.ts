import { supabase } from '@/lib/supabase'

// Minimal in-app notifications -- currently just one kind (webinar_new),
// fanned out server-side by a trigger on `webinars` insert (see migration
// 20260721170000_notifications.sql) rather than app code, since there's no
// "create webinar" flow in the app to hook into anyway.

export interface NotificationRow {
  id: string
  kind: string
  title: string
  body: string
  link: string | null
  read: boolean
  createdAt: string
}

export async function currentUid(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id ?? null
}

export async function fetchNotifications(): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, kind, title, body, link, read, created_at')
    .order('created_at', { ascending: false })
    .limit(30)
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    kind: r.kind,
    title: r.title,
    body: r.body,
    link: r.link,
    read: r.read,
    createdAt: r.created_at,
  }))
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id)
  if (error) throw error
}

export async function markAllNotificationsRead(): Promise<void> {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('read', false)
  if (error) throw error
}
