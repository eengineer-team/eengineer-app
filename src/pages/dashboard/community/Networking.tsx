import * as React from 'react'
import { Paperclip, FileText, X, Trash2 } from 'lucide-react'
import type { Discipline, Introduction } from '@/lib/community-data'
import { readFileAsAttachment, type Attachment } from '@/lib/attachments'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { LabelCaps } from '@/components/ui/label-caps'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { supabase } from '@/lib/supabase'
import * as api from '@/lib/api/community'

// `discipline` scopes the feed to one group's members (Community hub → group
// space); omit for a global "Networking" view. Introductions are posted
// content, not a connect/status row — kept as a separate model from the
// BuilderProfile-backed Members tab (see Network.tsx) so this can't get
// tangled with the Members connect-request flow. Supabase-backed: one
// `introductions` row per Builder (unique profile_id) — posting again edits
// it in place.
export function Networking({ discipline }: { discipline?: Discipline } = {}) {
  const [intros, setIntros] = React.useState<Introduction[]>([])
  const [draft, setDraft] = React.useState('')
  const [pendingAttachment, setPendingAttachment] = React.useState<Attachment | null>(null)
  const [editing, setEditing] = React.useState(false)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const uidRef = React.useRef<string | null>(null)

  const refresh = React.useCallback(async () => {
    uidRef.current = await api.currentUid()
    try {
      setIntros(await api.fetchIntroductions())
    } catch (err) {
      console.error('Failed to load introductions', err)
    }
  }, [])

  React.useEffect(() => {
    void refresh()
    // Deferred — see the note in clubs-context.tsx.
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => void refresh(), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [refresh])

  const scoped = discipline ? intros.filter((i) => i.discipline === discipline) : intros
  const mine = scoped.find((i) => i.authorId === 'me')
  const others = scoped.filter((i) => i.authorId !== 'me')

  function post() {
    const text = draft.trim()
    if (!text && !pendingAttachment) return
    const uid = uidRef.current
    if (!uid) return
    // Preserves the existing intro's discipline on edit (same as the old
    // mock: only a brand-new intro takes the current group's discipline).
    const existing = intros.find((i) => i.authorId === 'me')
    const targetDiscipline = existing?.discipline ?? discipline ?? 'Other'

    setDraft('')
    setPendingAttachment(null)
    setEditing(false)
    api.upsertIntroduction(uid, targetDiscipline, text, pendingAttachment ?? undefined).then(refresh).catch((err) => {
      console.error('Introduction save failed', err)
      void refresh()
    })
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    readFileAsAttachment(file).then(setPendingAttachment)
  }

  function handleDelete() {
    if (!mine) return
    setDeleteError(null)
    setConfirmingDelete(false)
    const previous = intros
    setIntros((prev) => prev.filter((i) => i.id !== mine.id))
    api.deleteIntroduction(mine.id).catch((err) => {
      setIntros(previous)
      setDeleteError(err instanceof Error ? `Couldn't delete: ${err.message}` : "Couldn't delete your introduction.")
    })
  }

  function renderAttachment(attachment: Attachment) {
    if (attachment.kind === 'image') {
      return <img src={attachment.url} alt="" className="max-w-full max-h-64 rounded object-cover mt-2" />
    }
    if (attachment.kind === 'video') {
      return <video src={attachment.url} controls className="max-w-full max-h-64 rounded mt-2" />
    }
    return (
      <a
        href={attachment.url}
        download={attachment.name}
        className="mt-2 inline-flex items-center gap-1.5 font-sans text-[12px] text-gold-dark underline underline-offset-2 decoration-current/40 hover:decoration-current"
      >
        <FileText size={13} strokeWidth={1.8} />
        {attachment.name ?? 'Attachment'}
      </a>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <LabelCaps className="block mb-3">Your introduction</LabelCaps>
        {deleteError && (
          <p className="font-sans text-[0.8125rem] text-red-400 mb-3" role="alert">
            {deleteError}
          </p>
        )}
        {mine && !editing ? (
          <div className="bg-white/[0.03] border border-white/8 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-sans text-[0.875rem] text-dark-text leading-snug">{mine.text}</p>
                {mine.attachment && renderAttachment(mine.attachment)}
              </div>
              <div className="flex-shrink-0 flex items-center gap-3">
                <button
                  onClick={() => {
                    setDraft(mine.text)
                    setPendingAttachment(mine.attachment ?? null)
                    setEditing(true)
                  }}
                  className="font-sans text-[12px] text-dark-muted hover:text-white/80 transition-colors"
                >
                  Edit
                </button>
                <div className="relative">
                  <button
                    onClick={() => setConfirmingDelete((v) => !v)}
                    aria-label="Delete your introduction"
                    className="text-dark-muted hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={12} strokeWidth={1.8} />
                  </button>
                  {confirmingDelete && (
                    <ConfirmDialog
                      title="Delete your introduction?"
                      description="This cannot be undone."
                      onConfirm={handleDelete}
                      onClose={() => setConfirmingDelete(false)}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              placeholder="Introduce yourself — who you are, what you're building, and what you're into."
              className="w-full bg-white/5 border border-white/10 rounded px-3.5 py-2.5 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25 resize-none mb-2"
            />
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
              <input ref={fileInputRef} type="file" onChange={handleFileSelected} className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach a picture, video, or file"
                className="min-w-[36px] min-h-[36px] flex-shrink-0 flex items-center justify-center rounded text-dark-muted hover:text-white/85 hover-white-tint transition-colors"
              >
                <Paperclip size={15} strokeWidth={1.8} />
              </button>
              <Button variant="accent" size="sm" onClick={post} disabled={!draft.trim() && !pendingAttachment}>
                Post introduction
              </Button>
              {editing && (
                <Button
                  variant="shell"
                  size="sm"
                  onClick={() => {
                    setEditing(false)
                    setDraft('')
                    setPendingAttachment(null)
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <div>
        <LabelCaps className="block mb-3">Introductions</LabelCaps>
        {others.length === 0 ? (
          <p className="font-sans text-[0.8125rem] text-dark-muted">
            {discipline ? `No introductions in ${discipline} yet.` : 'No introductions yet.'}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {others.map((i) => (
              <div key={i.id} className="bg-white/[0.03] border border-white/8 rounded-lg p-4 flex gap-3">
                <Avatar name={i.name} size="md" theme="dashboard" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="font-sans text-[0.875rem] font-semibold text-dark-text">{i.name}</div>
                    <span className="font-sans text-[12px] text-dark-muted flex-shrink-0">{i.time}</span>
                  </div>
                  <div className="font-sans text-[0.75rem] text-dark-muted mb-2">{i.discipline}</div>
                  <p className="font-sans text-[0.8125rem] text-dark-text leading-snug">{i.text}</p>
                  {i.attachment && renderAttachment(i.attachment)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
