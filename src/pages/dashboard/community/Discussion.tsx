import * as React from 'react'
import { Paperclip, FileText, X, Trash2 } from 'lucide-react'
import type { Discipline, Post } from '@/lib/community-data'
import { readFileAsAttachment, type Attachment } from '@/lib/attachments'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { supabase } from '@/lib/supabase'
import * as api from '@/lib/api/community'
import { errorDetail } from '@/lib/utils'

// Per-discipline discussion feed — a lightweight, running thread scoped to
// one discipline's Community group ("Discussion" tab in CommunityGroup.tsx),
// distinct from both the Q&A feed (structured questions with
// approve/disapprove voting) and Networking (one intro per person, editable
// in place). Posts here are just a chronological feed anyone can add to, no
// voting or single-post-per-person constraint. Supabase-backed via the
// `discussion_posts` table.
export function Discussion({ discipline }: { discipline?: Discipline } = {}) {
  const [posts, setPosts] = React.useState<Post[]>([])
  const [draft, setDraft] = React.useState('')
  const [pendingAttachment, setPendingAttachment] = React.useState<Attachment | null>(null)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const uidRef = React.useRef<string | null>(null)

  const refresh = React.useCallback(async () => {
    uidRef.current = await api.currentUid()
    try {
      setPosts(await api.fetchDiscussionPosts())
    } catch (err) {
      console.error('Failed to load the discussion feed', err)
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

  const scoped = discipline ? posts.filter((p) => p.discipline === discipline) : posts
  const ordered = [...scoped].reverse()

  function submit() {
    const text = draft.trim()
    if (!text && !pendingAttachment) return
    const uid = uidRef.current
    if (!uid) return

    setDraft('')
    setPendingAttachment(null)
    api
      .postDiscussionPost(uid, discipline ?? 'Other', text, pendingAttachment ?? undefined)
      .then(refresh)
      .catch((err) => {
        console.error('Post failed', err)
        void refresh()
      })
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    readFileAsAttachment(file).then(setPendingAttachment)
  }

  function handleDelete(id: string) {
    setDeleteError(null)
    setConfirmingDelete(null)
    const previous = posts
    setPosts((prev) => prev.filter((p) => p.id !== id))
    api.deleteDiscussionPost(id).catch((err) => {
      setPosts(previous)
      const detail = errorDetail(err)
      setDeleteError(detail ? `Couldn't delete: ${detail}` : "Couldn't delete that post.")
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
    <div className="flex flex-col gap-6">
      <div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Share an update, ask the group something, or post a photo from your build."
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
          <Button variant="accent" size="sm" onClick={submit} disabled={!draft.trim() && !pendingAttachment}>
            Post
          </Button>
        </div>
      </div>

      <div>
        {deleteError && (
          <p className="font-sans text-[0.8125rem] text-red-400 mb-3" role="alert">
            {deleteError}
          </p>
        )}
        {ordered.length === 0 ? (
          <p className="font-sans text-[0.8125rem] text-dark-muted">
            {discipline ? `No discussion in ${discipline} yet.` : 'No discussion yet.'}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {ordered.map((p) => (
              <div key={p.id} className="bg-white/[0.03] border border-white/8 rounded-lg p-4 flex gap-3">
                <Avatar name={p.name} size="md" theme="dashboard" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="font-sans text-[0.875rem] font-semibold text-dark-text">{p.name}</div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-sans text-[12px] text-dark-muted">{p.time}</span>
                      {p.authorId === 'me' && (
                        <div className="relative">
                          <button
                            onClick={() => setConfirmingDelete((v) => (v === p.id ? null : p.id))}
                            aria-label="Delete this post"
                            className="text-dark-muted hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={12} strokeWidth={1.8} />
                          </button>
                          {confirmingDelete === p.id && (
                            <ConfirmDialog
                              title="Delete this post?"
                              description="This cannot be undone."
                              onConfirm={() => handleDelete(p.id)}
                              onClose={() => setConfirmingDelete(null)}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="font-sans text-[0.8125rem] text-dark-text leading-snug">{p.text}</p>
                  {p.attachment && renderAttachment(p.attachment)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
