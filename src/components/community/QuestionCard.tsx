import * as React from 'react'
import { ThumbsUp, ThumbsDown, Flag, MessageCircle, Trash2 } from 'lucide-react'
import type { Question } from '@/lib/community-data'
import { Avatar } from '@/components/ui/avatar'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

// Chat-message styling (per founder feedback: "make it like a telegram
// groupchat") instead of isolated Q&A cards — same underlying model (vote /
// report / comment, duplicate-check on submit) just rendered as a message
// bubble in a continuous feed rather than a bordered card. The discipline
// chip is dropped here since the whole feed is already scoped to one group.
export function QuestionCard({
  question,
  readOnly = false,
  onVote,
  onReport,
  onComment,
  onDeleteQuestion,
  onDeleteComment,
}: {
  question: Question
  readOnly?: boolean
  onVote: (id: string, vote: 'approve' | 'disapprove') => void
  onReport: (id: string) => void
  onComment: (id: string, text: string) => void
  onDeleteQuestion: (id: string) => void
  onDeleteComment: (id: string) => void
}) {
  const [showComments, setShowComments] = React.useState(false)
  const [draft, setDraft] = React.useState('')
  const [confirmingDelete, setConfirmingDelete] = React.useState(false)
  const [confirmingCommentDelete, setConfirmingCommentDelete] = React.useState<string | null>(null)
  const isMine = question.authorId === 'me'

  function submitComment() {
    const text = draft.trim()
    if (!text) return
    onComment(question.id, text)
    setDraft('')
  }

  return (
    <div className="flex gap-3 py-2.5 hover:bg-white/[0.02] transition-colors duration-150 -mx-2 px-2 rounded">
      <Avatar name={question.author} size="sm" theme="dashboard" className="flex-shrink-0 mt-0.5" />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="font-sans text-[0.8125rem] font-semibold text-dark-text">
            {question.author}
          </span>
          <span className="font-sans text-[13px] text-dark-muted">{question.time}</span>
        </div>

        {/* Message bubble */}
        <div className="inline-block max-w-[85%] sm:max-w-[70%] bg-white/6 rounded-lg rounded-tl-sm px-3.5 py-2.5">
          <p className="font-sans text-[0.875rem] leading-[1.5] text-dark-text">{question.text}</p>
        </div>

        {/* Actions — exactly 4: Approve, Disapprove, Report, Comment. Hidden
            for read-only (Google-preview) viewers per spec. */}
        {!readOnly && (
          <div className="flex items-center gap-0.5 -ml-2 mt-0.5">
            <button
              onClick={() => onVote(question.id, 'approve')}
              className={`flex items-center gap-1.5 px-2 py-1 rounded font-sans text-[13px] transition-colors duration-150 ${
                question.myVote === 'approve' ? 'text-corn-500' : 'text-dark-muted hover-white-tint hover:text-white/80'
              }`}
            >
              <ThumbsUp size={12} strokeWidth={1.8} />
              {question.approvals}
            </button>

            <button
              onClick={() => onVote(question.id, 'disapprove')}
              className={`flex items-center gap-1.5 px-2 py-1 rounded font-sans text-[13px] transition-colors duration-150 ${
                question.myVote === 'disapprove' ? 'text-red-400' : 'text-dark-muted hover-white-tint hover:text-white/80'
              }`}
            >
              <ThumbsDown size={12} strokeWidth={1.8} />
              {question.disapprovals}
            </button>

            <button
              onClick={() => onReport(question.id)}
              disabled={question.reported}
              className={`flex items-center gap-1.5 px-2 py-1 rounded font-sans text-[13px] transition-colors duration-150 disabled:opacity-50 ${
                question.reported ? 'text-dark-muted' : 'text-dark-muted hover-white-tint hover:text-white/80'
              }`}
            >
              <Flag size={12} strokeWidth={1.8} />
              {question.reported ? 'Reported' : 'Report'}
            </button>

            <button
              onClick={() => setShowComments((v) => !v)}
              className="flex items-center gap-1.5 px-2 py-1 rounded font-sans text-[13px] text-dark-muted hover-white-tint hover:text-white/80 transition-colors duration-150"
            >
              <MessageCircle size={12} strokeWidth={1.8} />
              {question.comments.length}
            </button>

            {isMine && (
              <div className="relative">
                <button
                  onClick={() => setConfirmingDelete((v) => !v)}
                  aria-label="Delete this message"
                  className="flex items-center gap-1.5 px-2 py-1 rounded font-sans text-[13px] text-dark-muted hover-white-tint hover:text-red-400 transition-colors duration-150"
                >
                  <Trash2 size={12} strokeWidth={1.8} />
                </button>
                {confirmingDelete && (
                  <ConfirmDialog
                    title="Delete this message?"
                    description={
                      question.comments.length > 0
                        ? `This also deletes ${question.comments.length} repl${question.comments.length === 1 ? 'y' : 'ies'}. This cannot be undone.`
                        : 'This cannot be undone.'
                    }
                    onConfirm={() => {
                      setConfirmingDelete(false)
                      onDeleteQuestion(question.id)
                    }}
                    onClose={() => setConfirmingDelete(false)}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Replies — indented, same bubble language as the parent message */}
        {showComments && (
          <div className="mt-2 pl-3 border-l-2 border-white/8 flex flex-col gap-2.5">
            {question.comments.map((c) => (
              <div key={c.id} className="flex gap-2">
                <Avatar name={c.author} size="sm" theme="dashboard" className="flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-sans text-[0.75rem] font-medium text-white/80">{c.author}</span>
                    {c.time && <span className="font-sans text-[12px] text-dark-muted">{c.time}</span>}
                  </div>
                  <div className="flex items-start gap-1.5">
                    <div className="inline-block bg-white/6 rounded-lg rounded-tl-sm px-3 py-1.5 mt-0.5">
                      <p className="font-sans text-[0.8125rem] text-white/80 leading-snug">{c.text}</p>
                    </div>
                    {c.authorId === 'me' && (
                      <div className="relative flex-shrink-0 mt-0.5">
                        <button
                          onClick={() => setConfirmingCommentDelete((v) => (v === c.id ? null : c.id))}
                          aria-label="Delete this reply"
                          className="text-dark-muted hover:text-red-400 transition-colors p-1"
                        >
                          <Trash2 size={11} strokeWidth={1.8} />
                        </button>
                        {confirmingCommentDelete === c.id && (
                          <ConfirmDialog
                            title="Delete this reply?"
                            description="This cannot be undone."
                            onConfirm={() => {
                              setConfirmingCommentDelete(null)
                              onDeleteComment(c.id)
                            }}
                            onClose={() => setConfirmingCommentDelete(null)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {!readOnly && (
              <div className="flex items-center gap-2 mt-0.5">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                  placeholder="Reply…"
                  className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-1.5 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25"
                />
                <button
                  onClick={submitComment}
                  className="font-sans text-[12px] font-semibold text-white/80 hover:text-white transition-colors px-2"
                >
                  Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
