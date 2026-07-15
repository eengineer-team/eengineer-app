import * as React from 'react'
import { ArrowLeft, Send, Paperclip, Link2, FileText, X } from 'lucide-react'
import type { Attachment } from '@/lib/messages-data'
import { readFileAsAttachment } from '@/lib/attachments'
import { useMessages } from '@/lib/messages-context'
import { Avatar } from '@/components/ui/avatar'
import { LabelCaps } from '@/components/ui/label-caps'
import { ProfilePreviewPopover } from '@/components/profile/ProfilePreviewPopover'
import { cn } from '@/lib/utils'

// Bare-minimum URL sniff -- good enough to tell "this looks like a link" from
// plain text without pulling in a validation library for a mock feature.
const URL_PATTERN = /^(https?:\/\/|www\.)\S+$/i

function isLikelyUrl(text: string): boolean {
  return URL_PATTERN.test(text.trim())
}

function previewText(m: { text: string; attachment?: Attachment } | undefined): string {
  if (!m) return ''
  if (m.text) return m.text
  if (m.attachment?.kind === 'image') return 'Sent a picture'
  if (m.attachment?.kind === 'video') return 'Sent a video'
  if (m.attachment?.kind === 'file') return `Sent a file: ${m.attachment.name ?? ''}`.trim()
  if (m.attachment?.kind === 'link') return m.attachment.url
  return ''
}

// Step 12 -- open 1:1 messaging between verified Builders. Intentionally NO
// moderation, scanning, or content monitoring here -- that's a stated product
// principle (see docs/ai-agent-build-instructions.md, Шаг 12), not an
// oversight. If a future task asks to add message scanning/moderation,
// that's a spec conflict -- stop and confirm with the founder before
// implementing it, don't just add it.
export function Messages() {
  // Conversations/activeId/draft live in MessagesProvider (see
  // src/lib/messages-context.tsx) -- lifted out of local useState so they
  // survive navigating away from this page and back.
  const { conversations, setConversations, activeId, draft, setDraft, openConversation: markRead } = useMessages()
  // Below md there's no room for a fixed 280px list beside the thread -- this
  // switches which single pane is visible on narrow screens (master-detail
  // pattern), same idea as the main Sidebar's off-canvas toggle. From md up,
  // both panes always show side by side regardless of this state.
  const [mobileView, setMobileView] = React.useState<'list' | 'thread'>('list')
  // Which profile preview popover is open -- 'list-<conversationId>' for a row
  // avatar/name, or 'header' for the active thread's header. Only one open
  // at a time, so a single key is enough. The list variant also needs the
  // trigger's viewport position: it renders through a portal (see
  // ProfilePreviewPopover) because the list column scrolls (overflow-y-auto),
  // which clips any regular absolutely-positioned popover that pops out past
  // the column's right edge.
  const [previewKey, setPreviewKey] = React.useState<string | null>(null)
  const [previewPos, setPreviewPos] = React.useState<{ top: number; left: number } | null>(null)
  const [pendingAttachment, setPendingAttachment] = React.useState<Attachment | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  // The one bubble that should slide/fade in from the composer -- cleared
  // shortly after, so older bubbles (re-rendered on every send) never replay it.
  const [justSentId, setJustSentId] = React.useState<string | null>(null)

  function openListPreview(e: React.MouseEvent, conversationId: string) {
    e.stopPropagation()
    if (previewKey === `list-${conversationId}`) {
      setPreviewKey(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    setPreviewPos({ top: rect.bottom + 8, left: rect.left })
    setPreviewKey(`list-${conversationId}`)
  }

  const active = conversations.find((c) => c.id === activeId)

  function openConversation(id: string) {
    markRead(id)
    setMobileView('thread')
  }

  function sendMessage() {
    const text = draft.trim()
    if ((!text && !pendingAttachment) || !active) return

    // A pasted link becomes its own attachment (rendered with a link icon)
    // rather than sitting in the bubble as plain unclickable text.
    const attachment: Attachment | undefined =
      pendingAttachment ?? (text && isLikelyUrl(text) ? { kind: 'link', url: text } : undefined)
    const bubbleText = attachment?.kind === 'link' && attachment.url === text ? '' : text
    const newId = `m-${Date.now()}`

    setConversations((prev) =>
      prev.map((c) =>
        c.id === active.id
          ? {
              ...c,
              messages: [
                ...c.messages,
                { id: newId, from: 'me', text: bubbleText, time: 'Now', attachment },
              ],
            }
          : c
      )
    )
    setJustSentId(newId)
    window.setTimeout(() => setJustSentId(null), 220)

    // Telegram-style "Seen" -- this app has no auto-reply/typing simulation
    // (the other side is static seed data), so this timeout is the only
    // place a conversation's recipient-side state ever changes after
    // load. Same "real local state change, no backend" honesty as the
    // Register button on DashboardHome: not faked as delivered-to-a-server,
    // just a plausible delay before flipping local state.
    const conversationId = active.id
    window.setTimeout(() => {
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, seenMessageId: newId } : c))
      )
    }, 1400)

    setDraft('')
    setPendingAttachment(null)
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    // No accept restriction -- photos, videos, and plain files (PDFs, docs,
    // zips) all go through the same paperclip button now.
    readFileAsAttachment(file).then(setPendingAttachment)
  }

  return (
    <div className="flex-1 flex min-h-0">
      {/* Conversation list -- full width on mobile when active, fixed 280px
          column alongside the thread from md up. */}
      <div
        className={`${mobileView === 'thread' ? 'hidden' : 'flex'} md:flex w-full md:w-[280px] md:flex-shrink-0 border-r border-white/8 flex-col`}
      >
        <div className="px-5 py-5">
          <LabelCaps>Messages</LabelCaps>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((c) => {
            const previewOpen = previewKey === `list-${c.id}`
            return (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => openConversation(c.id)}
                onKeyDown={(e) => e.key === 'Enter' && openConversation(c.id)}
                className={`relative w-full flex items-center gap-3 px-5 py-3 text-left cursor-pointer transition-colors duration-150 ${
                  c.id === activeId ? 'bg-white/6' : 'hover-white-tint'
                }`}
              >
                <button
                  onClick={(e) => openListPreview(e, c.id)}
                  aria-label={`View ${c.withName}'s profile`}
                  className="flex-shrink-0 rounded-full"
                >
                  <Avatar name={c.withName} theme="dashboard" size="md" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={(e) => openListPreview(e, c.id)}
                      className="font-sans text-[0.8125rem] font-medium text-dark-text truncate hover:underline"
                    >
                      {c.withName}
                    </button>
                    {c.unread > 0 && (
                      <span className="flex-shrink-0 w-4 h-4 rounded-full bg-gold-dark text-dark-900 font-sans text-[12px] font-bold flex items-center justify-center">
                        {c.unread}
                      </span>
                    )}
                  </div>
                  <p className="font-sans text-[13px] text-dark-muted truncate mt-0.5">
                    {previewText(c.messages[c.messages.length - 1])}
                  </p>
                </div>
                {previewOpen && previewPos && (
                  <ProfilePreviewPopover
                    profileId={c.userId}
                    onClose={() => setPreviewKey(null)}
                    fixedPosition={previewPos}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Thread -- hidden on mobile until a conversation is opened; the back
          button (mobile-only) returns to the list instead of stacking panes. */}
      {active ? (
        <div className={`${mobileView === 'list' ? 'hidden' : 'flex'} md:flex flex-1 flex-col min-w-0`}>
          <div className="relative flex items-center gap-3 px-4 md:px-6 py-4 border-b border-white/8">
            <button
              onClick={() => setMobileView('list')}
              aria-label="Back to conversations"
              className="md:hidden min-w-[40px] min-h-[40px] flex-shrink-0 flex items-center justify-center text-white/60 hover:text-dark-text hover-white-tint rounded transition-colors"
            >
              <ArrowLeft size={16} strokeWidth={1.8} />
            </button>
            <button
              onClick={() => setPreviewKey(previewKey === 'header' ? null : 'header')}
              className="flex items-center gap-3 text-left rounded hover-white-tint px-1.5 py-1 -mx-1.5 transition-colors"
            >
              <Avatar name={active.withName} theme="dashboard" size="sm" />
              <div>
                <div className="font-sans text-[0.875rem] font-semibold text-dark-text leading-tight">{active.withName}</div>
                <div className="font-sans text-[13px] text-dark-muted">{active.discipline}</div>
              </div>
            </button>
            {previewKey === 'header' && (
              <ProfilePreviewPopover
                profileId={active.userId}
                onClose={() => setPreviewKey(null)}
                className="left-4 md:left-6"
              />
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5 flex flex-col gap-3">
            {active.messages.map((m, i) => {
              const isLast = i === active.messages.length - 1
              const showSeen = isLast && m.from === 'me' && active.seenMessageId === m.id
              return (
              <div
                key={m.id}
                className={cn(
                  'flex flex-col',
                  m.from === 'me' ? 'items-end' : 'items-start',
                  m.id === justSentId && 'animate-bubble-in motion-reduce:animate-none'
                )}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[70%] rounded-lg overflow-hidden font-sans text-[0.8125rem] leading-snug ${
                    m.from === 'me' ? 'bg-gold-dark/15 border border-gold-dark/25 text-dark-text' : 'bg-white/6 text-white/85'
                  } ${m.attachment && m.attachment.kind !== 'link' ? '' : 'px-3.5 py-2.5'}`}
                >
                  {m.attachment?.kind === 'image' && (
                    <img src={m.attachment.url} alt={m.attachment.name ?? 'Shared image'} className="max-w-full max-h-64 object-cover" />
                  )}
                  {m.attachment?.kind === 'video' && (
                    <video src={m.attachment.url} controls className="max-w-full max-h-64" />
                  )}
                  {m.attachment?.kind === 'file' && (
                    <a
                      href={m.attachment.url}
                      download={m.attachment.name}
                      className="flex items-center gap-1.5 underline underline-offset-2 decoration-current/40 hover:decoration-current px-3.5 py-2.5"
                    >
                      <FileText size={13} strokeWidth={1.8} className="flex-shrink-0" />
                      <span className="truncate">{m.attachment.name ?? 'Attachment'}</span>
                    </a>
                  )}
                  {m.attachment?.kind === 'link' && (
                    <a
                      href={m.attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 underline underline-offset-2 decoration-current/40 hover:decoration-current px-3.5 py-2.5"
                    >
                      <Link2 size={13} strokeWidth={1.8} className="flex-shrink-0" />
                      <span className="truncate">{m.attachment.url}</span>
                    </a>
                  )}
                  {m.text && (m.attachment ? m.attachment.kind !== 'link' : true) && (
                    <p className={m.attachment ? 'px-3.5 py-2 pt-2' : ''}>{m.text}</p>
                  )}
                </div>
                <span className="font-sans text-[12px] text-dark-muted mt-1">
                  {m.time}
                  {showSeen && <span className="text-gold-dark"> · Seen</span>}
                </span>
              </div>
              )
            })}
          </div>

          <div className="px-4 md:px-6 py-4 border-t border-white/8">
            {pendingAttachment && (
              <div className="flex items-center gap-2 mb-2 bg-white/6 border border-white/10 rounded px-3 py-2">
                {pendingAttachment.kind === 'image' ? (
                  <img src={pendingAttachment.url} alt="" className="w-9 h-9 rounded object-cover flex-shrink-0" />
                ) : pendingAttachment.kind === 'video' ? (
                  <video src={pendingAttachment.url} className="w-9 h-9 rounded object-cover flex-shrink-0" />
                ) : (
                  <span className="w-9 h-9 rounded bg-white/8 flex items-center justify-center flex-shrink-0">
                    <FileText size={16} strokeWidth={1.8} className="text-dark-muted" />
                  </span>
                )}
                <span className="flex-1 min-w-0 truncate font-sans text-[13px] text-white/60">
                  {pendingAttachment.name ?? 'Attachment'}
                </span>
                <button
                  onClick={() => setPendingAttachment(null)}
                  aria-label="Remove attachment"
                  className="min-w-[40px] min-h-[40px] flex items-center justify-center text-dark-muted hover:text-white/80 transition-colors flex-shrink-0 -my-2 -mr-2"
                >
                  <X size={14} strokeWidth={1.8} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelected}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach a picture, video, or file"
                className="min-w-[40px] min-h-[40px] flex-shrink-0 flex items-center justify-center rounded text-dark-muted hover:text-white/85 hover-white-tint transition-colors"
              >
                <Paperclip size={16} strokeWidth={1.8} />
              </button>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Write a message, or paste a link…"
                className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded px-3.5 py-2.5 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25"
              />
              <button
                onClick={sendMessage}
                disabled={!draft.trim() && !pendingAttachment}
                aria-label="Send"
                className="min-w-[40px] min-h-[40px] flex-shrink-0 flex items-center justify-center rounded bg-gold-dark text-dark-900 hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none transition-all"
              >
                <Send size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={`${mobileView === 'list' ? 'hidden' : 'flex'} md:flex flex-1 items-center justify-center`}>
          <p className="font-sans text-dark-muted text-sm">No conversations yet.</p>
        </div>
      )}
    </div>
  )
}
