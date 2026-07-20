import { supabase } from '@/lib/supabase'
import { ME_ID } from '@/lib/profile-data'
import type { Attachment } from '@/lib/attachments'

// Supabase-backed replacement for messages-data.ts's SEED_CONVERSATIONS.
// RLS is the real authorization boundary — every write below relies on it,
// never re-checks it. In particular: conv_insert/msg_insert both call
// app.can_message(a,b), which requires the pair to be connected, both
// verified, neither blocked, and both allow_dms=true. This module never
// tries to replicate that logic in JS — it just calls insert and lets a
// denied write throw, which messages-context.tsx surfaces as a visible
// error. The UI's job (see messages-context.tsx / Messages.tsx) is to keep
// the composer from being reachable at all when can_message would fail.
//
// messages.attachment_kind is the Postgres enum {image, video, link} — unlike
// introductions/discussion_posts (plain text, no 'file'), a DM attachment can
// never be a generic file. Sending one would fail the enum check; callers
// must reject 'file' attachments before calling sendMessage.

export async function currentUid(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id ?? null
}

export interface DirectMessage {
  id: string
  conversationId: string
  senderId: string
  text: string
  attachment?: Attachment
  createdAt: string
}

export interface Conversation {
  id: string
  otherParticipantId: string
  createdAt: string
}

type ConversationRow = { id: string; participant_a: string; participant_b: string; created_at: string }
type MessageRow = {
  id: string
  conversation_id: string
  sender_id: string
  text: string
  attachment_kind: 'image' | 'video' | 'link' | null
  attachment_url: string | null
  attachment_name: string | null
  created_at: string
}

function mapConversation(r: ConversationRow, uid: string): Conversation {
  return {
    id: r.id,
    otherParticipantId: r.participant_a === uid ? r.participant_b : r.participant_a,
    createdAt: r.created_at,
  }
}

function mapMessage(r: MessageRow, uid: string): DirectMessage {
  const attachment: Attachment | undefined =
    r.attachment_kind && r.attachment_url ? { kind: r.attachment_kind, url: r.attachment_url, name: r.attachment_name ?? undefined } : undefined
  return {
    id: r.id,
    conversationId: r.conversation_id,
    senderId: r.sender_id === uid ? ME_ID : r.sender_id,
    text: r.text,
    attachment,
    createdAt: r.created_at,
  }
}

export async function fetchConversations(uid: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, participant_a, participant_b, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return ((data ?? []) as ConversationRow[]).map((r) => mapConversation(r, uid))
}

// One query for every message across every conversation the caller can see —
// same "load everything, derive views client-side" shape as fetchProfiles /
// fetchQuestions elsewhere in this codebase; there's no pagination anywhere
// in the app yet, and message volume here doesn't warrant inventing it first.
export async function fetchAllMessages(uid: string, conversationIds: string[]): Promise<DirectMessage[]> {
  if (conversationIds.length === 0) return []
  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, text, attachment_kind, attachment_url, attachment_name, created_at')
    .in('conversation_id', conversationIds)
    .order('created_at', { ascending: true })
  if (error) throw error
  return ((data ?? []) as MessageRow[]).map((r) => mapMessage(r, uid))
}

// Reuses an existing conversation between the pair if one exists in either
// column order (participant_a/participant_b is not canonical) — never
// creates a duplicate thread for the same two people.
export async function findOrCreateConversation(uid: string, otherId: string): Promise<string> {
  const { data: existing, error: findError } = await supabase
    .from('conversations')
    .select('id')
    .or(`and(participant_a.eq.${uid},participant_b.eq.${otherId}),and(participant_a.eq.${otherId},participant_b.eq.${uid})`)
    .maybeSingle()
  if (findError) throw findError
  if (existing) return existing.id

  const { data: created, error: insertError } = await supabase
    .from('conversations')
    .insert({ participant_a: uid, participant_b: otherId })
    .select('id')
    .single()
  if (insertError) throw insertError
  return created.id
}

export async function sendMessage(params: {
  conversationId: string
  senderId: string
  text: string
  attachment?: Attachment
}): Promise<void> {
  const { conversationId, senderId, text, attachment } = params
  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: senderId,
    text,
    attachment_kind: attachment?.kind === 'file' ? null : (attachment?.kind ?? null),
    attachment_url: attachment?.kind === 'file' ? null : (attachment?.url ?? null),
    attachment_name: attachment?.kind === 'file' ? null : (attachment?.name ?? null),
  })
  if (error) throw error
}

export async function deleteMessage(id: string): Promise<void> {
  const { error } = await supabase.from('messages').delete().eq('id', id)
  if (error) throw error
}

// ── Blocking ──────────────────────────────────────────────────────────────
// blocks_select only returns rows where blocker_id = auth.uid() — a caller
// can only ever learn who *they* blocked, never who blocked them. That's by
// design (app.is_blocked, used in msg_select, is SECURITY DEFINER and checks
// both directions internally), so a thread the other person blocked just
// looks empty rather than exposing that fact — see messages-context.tsx.

export async function fetchMyBlocks(uid: string): Promise<string[]> {
  const { data, error } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', uid)
  if (error) throw error
  return (data ?? []).map((r) => r.blocked_id)
}

export async function blockUser(uid: string, otherId: string): Promise<void> {
  const { error } = await supabase.from('blocks').insert({ blocker_id: uid, blocked_id: otherId })
  if (error) throw error
}

export async function unblockUser(uid: string, otherId: string): Promise<void> {
  const { error } = await supabase.from('blocks').delete().eq('blocker_id', uid).eq('blocked_id', otherId)
  if (error) throw error
}
