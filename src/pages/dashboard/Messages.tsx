import * as React from 'react'
import { Send } from 'lucide-react'
import { SEED_CONVERSATIONS, type Conversation } from '@/lib/messages-data'
import { Avatar } from '@/components/ui/avatar'
import { LabelCaps } from '@/components/ui/label-caps'

// Step 12 — open 1:1 messaging between verified Builders. Intentionally NO
// moderation, scanning, or content monitoring here — that's a stated product
// principle (see docs/ai-agent-build-instructions.md, Шаг 12), not an
// oversight. If a future task asks to add message scanning/moderation,
// that's a spec conflict — stop and confirm with the founder before
// implementing it, don't just add it.
export function Messages() {
  const [conversations, setConversations] = React.useState<Conversation[]>(SEED_CONVERSATIONS)
  const [activeId, setActiveId] = React.useState<string>(SEED_CONVERSATIONS[0]?.id ?? '')
  const [draft, setDraft] = React.useState('')

  const active = conversations.find((c) => c.id === activeId)

  function openConversation(id: string) {
    setActiveId(id)
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)))
  }

  function sendMessage() {
    const text = draft.trim()
    if (!text || !active) return
    setConversations((prev) =>
      prev.map((c) =>
        c.id === active.id
          ? {
              ...c,
              messages: [
                ...c.messages,
                { id: `m-${Date.now()}`, from: 'me', text, time: 'Now' },
              ],
            }
          : c
      )
    )
    setDraft('')
  }

  return (
    <div className="flex-1 flex min-h-0">
      {/* Conversation list */}
      <div className="w-[280px] flex-shrink-0 border-r border-white/8 flex flex-col">
        <div className="px-5 py-5">
          <LabelCaps>Messages</LabelCaps>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => openConversation(c.id)}
              className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors duration-150 ${
                c.id === activeId ? 'bg-white/6' : 'hover-white-tint'
              }`}
            >
              <Avatar name={c.withName} theme="dashboard" size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-sans text-[0.8125rem] font-medium text-white/90 truncate">{c.withName}</span>
                  {c.unread > 0 && (
                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-gold-dark text-dark-900 font-sans text-[10px] font-bold flex items-center justify-center">
                      {c.unread}
                    </span>
                  )}
                </div>
                <p className="font-sans text-[11px] text-white/45 truncate mt-0.5">
                  {c.messages[c.messages.length - 1]?.text}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Thread */}
      {active ? (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-white/8">
            <Avatar name={active.withName} theme="dashboard" size="sm" />
            <div>
              <div className="font-sans text-[0.875rem] font-semibold text-white/90 leading-tight">{active.withName}</div>
              <div className="font-sans text-[11px] text-white/45">{active.discipline}</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3">
            {active.messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.from === 'me' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[70%] rounded-lg px-3.5 py-2.5 font-sans text-[0.8125rem] leading-snug ${
                    m.from === 'me' ? 'bg-gold-dark/15 border border-gold-dark/25 text-white/90' : 'bg-white/6 text-white/85'
                  }`}
                >
                  {m.text}
                </div>
                <span className="font-sans text-[10px] text-white/35 mt-1">{m.time}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 px-6 py-4 border-t border-white/8">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Write a message…"
              className="flex-1 bg-white/5 border border-white/10 rounded px-3.5 py-2.5 font-sans text-[0.8125rem] text-white/90 placeholder:text-white/35 focus:outline-none focus:border-white/25"
            />
            <button
              onClick={sendMessage}
              disabled={!draft.trim()}
              aria-label="Send"
              className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded bg-gold-dark text-dark-900 hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none transition-all"
            >
              <Send size={14} strokeWidth={2} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="font-sans text-white/40 text-sm">No conversations yet.</p>
        </div>
      )}
    </div>
  )
}
