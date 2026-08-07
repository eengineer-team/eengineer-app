import * as React from 'react'
import { ArrowLeft, Send, Paperclip, Link2, FileText, ShieldOff, ShieldAlert, Trash2, X } from 'lucide-react'
import type { Attachment } from '@/lib/attachments'
import { readFileAsAttachment } from '@/lib/attachments'
import { ME_ID } from '@/lib/profile-data'
import { useMessages } from '@/lib/messages-context'
import type { DirectMessage } from '@/lib/api/messages'
import { Avatar } from '@/components/ui/avatar'
import { LabelCaps } from '@/components/ui/label-caps'
import { ProfilePreviewPopover } from '@/components/profile/ProfilePreviewPopover'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { cn, errorDetail, errorMessage } from '@/lib/utils'

// Bare-minimum URL sniff -- good enough to tell "this looks like a link" from
// plain text without pulling in a validation library.
const URL_PATTERN = /^(https?:\/\/|www\.)\S+$/i

function isLikelyUrl(text: string): boolean {
  return URL_PATTERN.test(text.trim())
}

function previewText(m: DirectMessage | undefined): string {
  if (!m) return ''
  if (m.text) return m.text
  if (m.attachment?.kind === 'image') return 'Sent a picture'
  if (m.attachment?.kind === 'video') return 'Sent a video'
  if (m.attachment?.kind === 'link') return m.attachment.url
  return ''
}

function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

// Domain 4 -- real 1:1 messaging between connected, verified Builders,
// Supabase-backed (see messages-context.tsx). Intentionally NO moderation,
// scanning, or content monitoring here -- that's a stated product principle,
// not an oversight. If a future task asks to add message scanning/moderation,
// that's a spec conflict -- stop and confirm with the founder before
// implementing it, don't just add it.
//
// There is also no "Seen" receipt and no server-tracked unread count -- the
// old mock faked both with a local setTimeout. The schema has no receipt
// data, so this doesn't recreate that as a lie; unread here is an honest
// per-device "since I last opened this thread on this browser" count (see
// messages-context.tsx).
export function Messages() {
  const {
    conversations,
    loading,
    activeId,
    openConversation: markRead,
    draft,
    setDraft,
    sendMessage,
    deleteMessage,
    blockUser,
    unblockUser,
  } = useMessages()
  // Below md there's no room for a fixed 280px list beside the thread -- this
  // switches which single pane is visible on narrow screens (master-detail
  // pattern), same idea as the main Sidebar's off-canvas toggle. From md up,
  // both panes always show side by side regardless of this state.
  const [mobileView, setMobileView] = React.useState<'list' | 'thread'>('list')
  const [previewKey, setPreviewKey] = React.useState<string | null>(null)
  const [previewPos, setPreviewPos] = React.useState<{ top: number; left: number } | null>(null)
  const [pendingAttachment, setPendingAttachment] = React.useState<Attachment | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [sendError, setSendError] = React.useState<string | null>(null)
  const [attachError, setAttachError] = React.useState<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = React.useState<string | null>(null)
  const [confirmingBlock, setConfirmingBlock] = React.useState(false)
  const [blockError, setBlockError] = React.useState<string | null>(null)

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
  // Only reachable when connected + both allow_dms=true — conv_insert
  // wouldn't have let the conversation exist otherwise. allow_dms can still
  // change *after* creation, which is what this reflects.
  const canCompose = !!active && active.allowDMs && !active.isBlockedByMe

  function openConversation(id: string) {
    markRead(id)
    setMobileView('thread')
  }

  async function handleSend() {
    const text = draft.trim()
    if ((!text && !pendingAttachment) || !active) return
    setSendError(null)

    // A pasted link becomes its own attachment (rendered with a link icon)
    // rather than sitting in the bubble as plain unclickable text.
    const attachment: Attachment | undefined =
      pendingAttachment ?? (text && isLikelyUrl(text) ? { kind: 'link', url: text } : undefined)
    const bubbleText = attachment?.kind === 'link' && attachment.url === text ? '' : text

    const savedDraft = draft
    const savedAttachment = pendingAttachment
    setDraft('')
    setPendingAttachment(null)

    try {
      await sendMessage(bubbleText, attachment)
    } catch (err) {
      // Put the draft back rather than silently eating what they typed.
      setDraft(savedDraft)
      setPendingAttachment(savedAttachment)
      const detail = errorDetail(err)
      setSendError(detail ? `Couldn't send: ${detail}` : "Couldn't send that message.")
    }
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setAttachError(null)
    // messages.attachment_kind is a DB enum of {image, video, link} — no
    // 'file' kind exists for DMs (unlike Discussion/Networking attachments).
    // The file input below already restricts selection to image/video; this
    // is the fallback for a MIME type readFileAsAttachment couldn't classify.
    readFileAsAttachment(file).then((attachment) => {
      if (attachment.kind === 'file') {
        setAttachError('Only images and videos can be attached to a message.')
        return
      }
      setPendingAttachment(attachment)
    })
  }

  async function handleDeleteMessage(id: string) {
    setConfirmingDeleteId(null)
    setSendError(null)
    try {
      await deleteMessage(id)
    } catch (err) {
      const detail = errorDetail(err)
      setSendError(detail ? `Couldn't delete: ${detail}` : "Couldn't delete that message.")
    }
  }

  async function handleBlock() {
    if (!active) return
    setBlockError(null)
    setConfirmingBlock(false)
    try {
      await blockUser(active.otherParticipantId)
    } catch (err) {
      setBlockError(errorMessage(err, "Couldn't block that person."))
    }
  }

  async function handleUnblock() {
    if (!active) return
    setBlockError(null)
    try {
      await unblockUser(active.otherParticipantId)
    } catch (err) {
      setBlockError(errorMessage(err, "Couldn't unblock that person."))
    }
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
          {loading ? (
            <p className="font-sans text-[0.8125rem] text-dark-muted px-5">Loading…</p>
          ) : conversations.length === 0 ? (
            <p className="font-sans text-[0.8125rem] text-dark-muted px-5">
              No conversations yet — message someone you're connected with from their profile.
            </p>
          ) : (
            conversations.map((c) => {
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
                    <Avatar name={c.withName} src={c.avatarUrl} theme="dashboard" size="md" />
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
                      {c.messages.length === 0 ? 'No messages yet' : previewText(c.messages[c.messages.length - 1])}
                    </p>
                  </div>
                  {previewOpen && previewPos && (
                    <ProfilePreviewPopover
                      profileId={c.otherParticipantId}
                      onClose={() => setPreviewKey(null)}
                      fixedPosition={previewPos}
                    />
                  )}
                </div>
              )
            })
          )}
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
              className="flex items-center gap-3 text-left rounded hover-white-tint px-1.5 py-1 -mx-1.5 transition-colors flex-1 min-w-0"
            >
              <Avatar name={active.withName} src={active.avatarUrl} theme="dashboard" size="sm" />
              <div className="min-w-0">
                <div className="font-sans text-[0.875rem] font-semibold text-dark-text leading-tight truncate">{active.withName}</div>
                <div className="font-sans text-[13px] text-dark-muted truncate">{active.discipline}</div>
              </div>
            </button>
            {active.isBlockedByMe ? (
              <button
                onClick={() => void handleUnblock()}
                className="flex-shrink-0 flex items-center gap-1.5 font-sans text-[12px] text-dark-muted hover:text-white/80 transition-colors"
              >
                <ShieldOff size={13} strokeWidth={1.8} />
                Unblock
              </button>
            ) : (
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setConfirmingBlock((v) => !v)}
                  aria-label={`Block ${active.withName}`}
                  className="flex items-center gap-1.5 font-sans text-[12px] text-dark-muted hover:text-red-400 transition-colors"
                >
                  <ShieldAlert size={13} strokeWidth={1.8} />
                  Block
                </button>
                {confirmingBlock && (
                  <ConfirmDialog
                    title={`Block ${active.withName}?`}
                    description="They won't be able to message you, and you won't see any past or future messages between you. This can be undone from this conversation."
                    confirmLabel="Block"
                    onConfirm={() => void handleBlock()}
                    onClose={() => setConfirmingBlock(false)}
                  />
                )}
              </div>
            )}
            {previewKey === 'header' && (
              <ProfilePreviewPopover
                profileId={active.otherParticipantId}
                onClose={() => setPreviewKey(null)}
                className="left-4 md:left-6"
              />
            )}
          </div>

          {blockError && (
            <p className="font-sans text-[0.8125rem] text-red-400 px-4 md:px-6 pt-3" role="alert">
              {blockError}
            </p>
          )}

          {active.isBlockedByMe && (
            <p className="font-sans text-[0.8125rem] text-dark-muted px-4 md:px-6 pt-3">
              You've blocked {active.withName}. Unblock them to see or send messages here again.
            </p>
          )}

          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5 flex flex-col gap-3">
            {active.messages.length === 0 && !active.isBlockedByMe && (
              <p className="font-sans text-[0.8125rem] text-dark-muted text-center mt-4">
                No messages in this conversation yet — say hello.
              </p>
            )}
            {active.messages.map((m) => {
              const isMine = m.senderId === ME_ID
              return (
                <div key={m.id} className={cn('flex flex-col', isMine ? 'items-end' : 'items-start')}>
                  <div className="flex items-end gap-1.5">
                    {isMine && (
                      <div className="relative">
                        <button
                          onClick={() => setConfirmingDeleteId((v) => (v === m.id ? null : m.id))}
                          aria-label="Delete this message"
                          className="text-dark-muted hover:text-red-400 transition-colors p-1"
                        >
                          <Trash2 size={12} strokeWidth={1.8} />
                        </button>
                        {confirmingDeleteId === m.id && (
                          <ConfirmDialog
                            title="Delete this message?"
                            description="This cannot be undone."
                            onConfirm={() => void handleDeleteMessage(m.id)}
                            onClose={() => setConfirmingDeleteId(null)}
                            className="absolute z-40 bottom-full right-0 mb-2 w-[260px] bg-dark-100 border border-white/12 rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.5)] p-4"
                          />
                        )}
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] rounded-lg font-sans text-[0.8125rem] leading-snug break-words ${
                        m.attachment?.kind === 'image' || m.attachment?.kind === 'video' ? 'overflow-hidden' : ''
                      } ${
                        isMine ? 'bg-gold-dark/15 border border-gold-dark/25 text-dark-text' : 'bg-dark-surface2 border border-white/8 text-white/85'
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
                        <p className={`whitespace-pre-wrap ${m.attachment ? 'px-3.5 py-2 pt-2' : ''}`}>{m.text}</p>
                      )}
                    </div> 
                  </div>
                  <span className="font-sans text-[12px] text-dark-muted mt-1">{formatMessageTime(m.createdAt)}</span>
                </div>
              )
            })}
          </div>

          <div className="px-4 md:px-6 py-4 border-t border-white/8">
            {sendError && (
              <p className="font-sans text-[0.8125rem] text-red-400 mb-2" role="alert">
                {sendError}
              </p>
            )}
            {!canCompose ? (
              <p className="font-sans text-[0.8125rem] text-dark-muted text-center py-2">
                {active.isBlockedByMe
                  ? "You've blocked this person — unblock them to send a message."
                  : `${active.withName} has turned off direct messages.`}
              </p>
            ) : (
              <>
                {attachError && (
                  <p className="font-sans text-[0.8125rem] text-red-400 mb-2" role="alert">
                    {attachError}
                  </p>
                )}
                {pendingAttachment && (
                  <div className="flex items-center gap-2 mb-2 bg-white/6 border border-white/10 rounded px-3 py-2">
                    {pendingAttachment.kind === 'image' ? (
                      <img src={pendingAttachment.url} alt="" className="w-9 h-9 rounded object-cover flex-shrink-0" />
                    ) : (
                      <video src={pendingAttachment.url} className="w-9 h-9 rounded object-cover flex-shrink-0" />
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
                    accept="image/*,video/*"
                    onChange={handleFileSelected}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Attach a picture or video"
                    className="min-w-[40px] min-h-[40px] flex-shrink-0 flex items-center justify-center rounded text-dark-muted hover:text-white/85 hover-white-tint transition-colors"
                  >
                    <Paperclip size={16} strokeWidth={1.8} />
                  </button>
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && void handleSend()}
                    placeholder="Write a message, or paste a link…"
                    className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded px-3.5 py-2.5 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25"
                  />
                  <button
                    onClick={() => void handleSend()}
                    disabled={!draft.trim() && !pendingAttachment}
                    aria-label="Send"
                    className="min-w-[40px] min-h-[40px] flex-shrink-0 flex items-center justify-center rounded bg-gold-dark text-dark-900 hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none transition-all"
                  >
                    <Send size={14} strokeWidth={2} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className={`${mobileView === 'list' ? 'hidden' : 'flex'} md:flex flex-1 items-center justify-center`}>
          <p className="font-sans text-dark-muted text-sm">
            {loading ? 'Loading…' : 'No conversations yet.'}
          </p>
        </div>
      )}
    </div>
  )
}
