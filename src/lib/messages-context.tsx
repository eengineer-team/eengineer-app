import * as React from 'react'
import { SEED_CONVERSATIONS, type Conversation } from '@/lib/messages-data'
import { usePersistentState } from '@/lib/use-persistent-state'

// Lifted out of Messages.tsx (Step 12) so conversation state — unread counts,
// the active thread, the draft — survives navigating away from /dashboard/messages.
// Previously this all lived in useState inside the page component: leaving the
// page (e.g. to check the Calendar) and coming back wiped the draft and reset
// which thread was open. Same context also backs the header's message badge,
// so the unread count there is the real one instead of a hardcoded number.
interface MessagesContextValue {
  conversations: Conversation[]
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>
  activeId: string
  setActiveId: (id: string) => void
  draft: string
  setDraft: (draft: string) => void
  unreadTotal: number
  openConversation: (id: string) => void
}

const MessagesContext = React.createContext<MessagesContextValue | null>(null)

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = usePersistentState<Conversation[]>('ee:messages', SEED_CONVERSATIONS)
  const [activeId, setActiveId] = usePersistentState<string>('ee:messages:activeId', SEED_CONVERSATIONS[0]?.id ?? '')
  // Keyed by conversation id so switching threads without sending never
  // leaks one conversation's in-progress text into another's input.
  const [drafts, setDrafts] = React.useState<Record<string, string>>({})

  const draft = drafts[activeId] ?? ''
  const setDraft = React.useCallback((value: string) => {
    setDrafts((prev) => ({ ...prev, [activeId]: value }))
  }, [activeId])

  const unreadTotal = React.useMemo(
    () => conversations.reduce((sum, c) => sum + c.unread, 0),
    [conversations]
  )

  const openConversation = React.useCallback((id: string) => {
    setActiveId(id)
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)))
  }, [])

  const value = React.useMemo(
    () => ({ conversations, setConversations, activeId, setActiveId, draft, setDraft, unreadTotal, openConversation }),
    [conversations, activeId, draft, setDraft, unreadTotal, openConversation]
  )

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>
}

export function useMessages() {
  const ctx = React.useContext(MessagesContext)
  if (!ctx) throw new Error('useMessages must be used within MessagesProvider')
  return ctx
}
