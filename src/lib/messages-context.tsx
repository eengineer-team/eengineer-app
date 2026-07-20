import * as React from 'react'
import { ME_ID } from '@/lib/profile-data'
import { useProfiles } from '@/lib/profiles-context'
import { usePersistentState } from '@/lib/use-persistent-state'
import { supabase } from '@/lib/supabase'
import * as api from '@/lib/api/messages'
import type { DirectMessage, Conversation } from '@/lib/api/messages'
import type { Attachment } from '@/lib/attachments'

// Supabase-backed replacement for the mock SEED_CONVERSATIONS/localStorage
// store. RLS (see supabase/migrations/20260716120400_block18_age_consent.sql
// and 20260716120200_rls.sql) is the real gate on who can message whom —
// connected + both verified + neither blocked + both allow_dms — this module
// mirrors that in JS only enough to decide what to RENDER (composer visible
// vs. "Connect first" / "DMs off" / "You've blocked them"), never to
// second-guess a write the server allows or blocks.
//
// "Seen" read receipts and unread counts were faked client-side in the old
// mock (a setTimeout flipping local state). There's no receipt data in the
// schema — this is deliberately dropped rather than kept as a fake. Unread
// *is* kept, but as an honest per-device "messages since I last opened this
// thread on this browser" count (localStorage), same category as the
// sidebar-collapsed / opportunities-discipline-filter local prefs elsewhere
// in this app — not a claim about server-tracked read state.

export interface ConversationView {
  id: string
  otherParticipantId: string
  withName: string
  discipline: string
  avatarUrl?: string
  /** false only when the other Builder has explicitly turned DMs off. */
  allowDMs: boolean
  messages: DirectMessage[]
  unread: number
  /** True only if *I* blocked them — blocks_select can't tell me the reverse
   *  (see api/messages.ts), so a thread the other side blocked just renders
   *  as empty rather than claiming to know why. */
  isBlockedByMe: boolean
}

interface MessagesContextValue {
  conversations: ConversationView[]
  loading: boolean
  activeId: string | null
  setActiveId: (id: string) => void
  openConversation: (id: string) => void
  draft: string
  setDraft: (value: string) => void
  unreadTotal: number
  /** Finds or creates the conversation with this profile and makes it
   *  active. Only ever call this from a connected, DM-able profile — RLS
   *  will deny the insert otherwise, and this rethrows that denial rather
   *  than swallowing it. */
  startConversation: (otherProfileId: string) => Promise<string>
  sendMessage: (text: string, attachment?: Attachment) => Promise<void>
  deleteMessage: (id: string) => Promise<void>
  blockUser: (otherProfileId: string) => Promise<void>
  unblockUser: (otherProfileId: string) => Promise<void>
}

const MessagesContext = React.createContext<MessagesContextValue | null>(null)

const LAST_READ_KEY = 'ee:messages:lastRead'
const EPOCH = new Date(0).toISOString()

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const { getProfile } = useProfiles()
  const [conversationsRaw, setConversationsRaw] = React.useState<Conversation[]>([])
  const [messagesRaw, setMessagesRaw] = React.useState<DirectMessage[]>([])
  const [blockedByMe, setBlockedByMe] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [lastRead, setLastRead] = usePersistentState<Record<string, string>>(LAST_READ_KEY, {})
  const [drafts, setDrafts] = React.useState<Record<string, string>>({})
  const uidRef = React.useRef<string | null>(null)

  const draft = activeId ? drafts[activeId] ?? '' : ''
  const setDraft = React.useCallback(
    (value: string) => {
      if (!activeId) return
      setDrafts((prev) => ({ ...prev, [activeId]: value }))
    },
    [activeId]
  )

  const refresh = React.useCallback(async () => {
    uidRef.current = await api.currentUid()
    const uid = uidRef.current
    if (!uid) {
      setConversationsRaw([])
      setMessagesRaw([])
      setBlockedByMe([])
      setLoading(false)
      return
    }
    try {
      const convs = await api.fetchConversations(uid)
      const [msgs, blocked] = await Promise.all([
        api.fetchAllMessages(uid, convs.map((c) => c.id)),
        api.fetchMyBlocks(uid),
      ])
      setConversationsRaw(convs)
      setMessagesRaw(msgs)
      setBlockedByMe(blocked)
    } catch (err) {
      console.error('Failed to load messages', err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    let cancelled = false
    let channel: ReturnType<typeof supabase.channel> | null = null

    // Same hard-won recipe as QAFeed.tsx: wait for the restored session and
    // push its token onto the realtime socket before subscribing, or a
    // subscription made while still on the anon key reports SUBSCRIBED and
    // then silently never delivers a row.
    async function connect() {
      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      if (data.session) await supabase.realtime.setAuth(data.session.access_token)
      if (cancelled) return

      // No `filter` — msg_select's RLS (participant AND NOT blocked) already
      // narrows delivery to rows this session can see, same "subscribe
      // broadly, let RLS narrow it" shape as QAFeed's questions channel.
      // messages is REPLICA IDENTITY DEFAULT, so DELETE payloads carry only
      // the primary key — refresh() re-fetches rather than reading old
      // values off the payload.
      channel = supabase
        .channel('dm-messages')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => void refresh())
        .subscribe((status, err) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.error(`DM realtime channel ${status}`, err ?? '')
          }
        })
    }

    void refresh()
    void connect()

    // Deferred: supabase-js holds a lock while dispatching this event, and
    // both refresh() and connect() call auth methods — calling in-line
    // deadlocks the client (same note as clubs-context.tsx / QAFeed.tsx).
    const authSub = supabase.auth.onAuthStateChange((event) => {
      setTimeout(() => {
        void refresh()
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          if (channel) void supabase.removeChannel(channel)
          channel = null
          void connect()
        }
      }, 0)
    })

    return () => {
      cancelled = true
      authSub.data.subscription.unsubscribe()
      if (channel) void supabase.removeChannel(channel)
    }
  }, [refresh])

  const openConversation = React.useCallback(
    (id: string) => {
      setActiveId(id)
      setLastRead((prev) => ({ ...prev, [id]: new Date().toISOString() }))
    },
    [setLastRead]
  )

  const startConversation = React.useCallback(
    async (otherProfileId: string) => {
      const uid = uidRef.current
      if (!uid) throw new Error('Still signing you in — try again in a moment.')
      const id = await api.findOrCreateConversation(uid, otherProfileId)
      await refresh()
      openConversation(id)
      return id
    },
    [refresh, openConversation]
  )

  const sendMessage = React.useCallback(
    async (text: string, attachment?: Attachment) => {
      const uid = uidRef.current
      const trimmed = text.trim()
      if (!uid || !activeId || (!trimmed && !attachment)) return
      // The DM attachment_kind enum is {image, video, link} only — a generic
      // 'file' would fail the column check. Callers (the file picker in
      // Messages.tsx) already restrict selection to image/video, this is the
      // last line of defense.
      if (attachment?.kind === 'file') {
        throw new Error('Only images, videos, or links can be attached to a message.')
      }
      // No optimistic append — the realtime subscription above brings the
      // new row straight back, same "just call the API, let realtime show
      // it" shape as QAFeed's handleComment.
      await api.sendMessage({ conversationId: activeId, senderId: uid, text: trimmed, attachment })
    },
    [activeId]
  )

  const deleteMessage = React.useCallback(async (id: string) => {
    const previous = messagesRaw
    setMessagesRaw((prev) => prev.filter((m) => m.id !== id))
    try {
      await api.deleteMessage(id)
    } catch (err) {
      setMessagesRaw(previous)
      throw err
    }
  }, [messagesRaw])

  const blockUser = React.useCallback(async (otherProfileId: string) => {
    const uid = uidRef.current
    if (!uid) throw new Error('Still signing you in — try again in a moment.')
    const previous = blockedByMe
    setBlockedByMe((prev) => (prev.includes(otherProfileId) ? prev : [...prev, otherProfileId]))
    try {
      await api.blockUser(uid, otherProfileId)
    } catch (err) {
      setBlockedByMe(previous)
      throw err
    }
  }, [blockedByMe])

  const unblockUser = React.useCallback(async (otherProfileId: string) => {
    const uid = uidRef.current
    if (!uid) throw new Error('Still signing you in — try again in a moment.')
    const previous = blockedByMe
    setBlockedByMe((prev) => prev.filter((id) => id !== otherProfileId))
    try {
      await api.unblockUser(uid, otherProfileId)
    } catch (err) {
      setBlockedByMe(previous)
      throw err
    }
  }, [blockedByMe])

  const conversations = React.useMemo<ConversationView[]>(() => {
    const views = conversationsRaw.map((c): ConversationView => {
      const profile = getProfile(c.otherParticipantId)
      const messages = messagesRaw.filter((m) => m.conversationId === c.id)
      // Date.getTime() comparison, not string comparison — PostgREST
      // serializes timestamptz with a "+00:00" offset while
      // Date.toISOString() (used below for lastRead) always ends in "Z";
      // lexicographic comparison of those two suffixes doesn't agree with
      // chronological order.
      const readAt = new Date(lastRead[c.id] ?? EPOCH).getTime()
      const unread = messages.filter((m) => m.senderId !== ME_ID && new Date(m.createdAt).getTime() > readAt).length
      return {
        id: c.id,
        otherParticipantId: c.otherParticipantId,
        withName: profile?.name ?? 'A Builder',
        discipline: profile?.discipline ?? '',
        avatarUrl: profile?.avatarUrl,
        allowDMs: profile?.allowDMs !== false,
        messages,
        unread,
        isBlockedByMe: blockedByMe.includes(c.otherParticipantId),
      }
    })
    // Most recent activity first — falls back to conversation creation time
    // for a brand-new thread with no messages yet. Date.getTime(), not
    // string comparison — see the readAt note above.
    return views.sort((a, b) => {
      const aTime = a.messages.at(-1)?.createdAt ?? conversationsRaw.find((c) => c.id === a.id)?.createdAt ?? EPOCH
      const bTime = b.messages.at(-1)?.createdAt ?? conversationsRaw.find((c) => c.id === b.id)?.createdAt ?? EPOCH
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })
  }, [conversationsRaw, messagesRaw, blockedByMe, getProfile, lastRead])

  const unreadTotal = React.useMemo(() => conversations.reduce((sum, c) => sum + c.unread, 0), [conversations])

  const value = React.useMemo(
    () => ({
      conversations,
      loading,
      activeId,
      setActiveId,
      openConversation,
      draft,
      setDraft,
      unreadTotal,
      startConversation,
      sendMessage,
      deleteMessage,
      blockUser,
      unblockUser,
    }),
    [conversations, loading, activeId, openConversation, draft, setDraft, unreadTotal, startConversation, sendMessage, deleteMessage, blockUser, unblockUser]
  )

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>
}

export function useMessages() {
  const ctx = React.useContext(MessagesContext)
  if (!ctx) throw new Error('useMessages must be used within MessagesProvider')
  return ctx
}
