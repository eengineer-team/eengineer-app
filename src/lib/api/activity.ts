import { supabase } from '@/lib/supabase'
import type { Discipline } from '@/lib/community-data'
import type { Attachment } from '@/lib/attachments'
import { ME_ID } from '@/lib/profile-data'

// Supabase-backed replacement for current-activity-context.tsx's mock store.
// The old version used usePersistentState (localStorage): it *looked* like a
// shared "what's everyone building right now" feed, but every post only ever
// lived in the poster's own browser -- nobody else's tab could ever see it.
// That's the same "functional honesty" problem the original UX audit flagged
// for #1, just not caught at the time because this feature has only one
// caller (ProjectsHub.tsx) and was easy to overlook. RLS is the real
// authorization boundary; this module never re-checks it.

export async function currentUid(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id ?? null
}

export interface ActivityUpdate {
  id: string
  authorId: string
  authorName: string
  discipline: Discipline
  text: string
  attachment?: Attachment
  createdAt: string
}

const ACTIVITY_SELECT = `
  id, author_id, discipline, text, attachment_kind, attachment_url, attachment_name, created_at,
  profiles!activity_updates_author_id_fkey ( display_name )
`

type ActivityRow = {
  id: string
  author_id: string
  discipline: Discipline
  text: string
  attachment_kind: 'image' | 'video' | 'file' | null
  attachment_url: string | null
  attachment_name: string | null
  created_at: string
  profiles: { display_name: string } | null
}

// authorId is swapped to the ME_ID sentinel for the caller's own rows -- same
// convention api/community.ts uses for questions/comments/introductions/
// discussion posts, so every feed in the app agrees on how "is this mine"
// is spelled in the UI.
function mapRow(r: ActivityRow, uid: string | null): ActivityUpdate {
  const attachment: Attachment | undefined =
    r.attachment_kind && r.attachment_url
      ? { kind: r.attachment_kind, url: r.attachment_url, name: r.attachment_name ?? undefined }
      : undefined
  return {
    id: r.id,
    authorId: uid && r.author_id === uid ? ME_ID : r.author_id,
    authorName: r.profiles?.display_name ?? 'A Builder',
    discipline: r.discipline,
    text: r.text,
    attachment,
    createdAt: r.created_at,
  }
}

export async function fetchActivity(): Promise<ActivityUpdate[]> {
  const uid = await currentUid()
  const { data, error } = await supabase
    .from('activity_updates')
    .select(ACTIVITY_SELECT)
    .order('created_at', { ascending: false })
  if (error) throw error
  return ((data ?? []) as unknown as ActivityRow[]).map((r) => mapRow(r, uid))
}

export async function postActivity(
  authorId: string,
  discipline: Discipline,
  text: string,
  attachment?: Attachment
): Promise<void> {
  // 'link' is message-only (see attachments.ts) -- the file picker here only
  // ever produces image/video/file, but this is the last line of defense
  // against the column's check constraint, same guard as sendMessage's.
  if (attachment?.kind === 'link') {
    throw new Error('Only images, videos, or files can be attached to an update.')
  }
  const { error } = await supabase.from('activity_updates').insert({
    author_id: authorId,
    discipline,
    text,
    attachment_kind: attachment?.kind ?? null,
    attachment_url: attachment?.url ?? null,
    attachment_name: attachment?.name ?? null,
  })
  if (error) throw error
}

export async function deleteActivity(id: string): Promise<void> {
  const { error } = await supabase.from('activity_updates').delete().eq('id', id)
  if (error) throw error
}
