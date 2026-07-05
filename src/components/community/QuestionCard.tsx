import * as React from 'react'
import { ThumbsUp, ThumbsDown, Flag, MessageCircle } from 'lucide-react'
import type { Question } from '@/lib/community-data'

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}

export function QuestionCard({
  question,
  readOnly = false,
  onVote,
  onReport,
  onComment,
}: {
  question: Question
  readOnly?: boolean
  onVote: (id: string, vote: 'approve' | 'disapprove') => void
  onReport: (id: string) => void
  onComment: (id: string, text: string) => void
}) {
  const [showComments, setShowComments] = React.useState(false)
  const [draft, setDraft] = React.useState('')

  function submitComment() {
    const text = draft.trim()
    if (!text) return
    onComment(question.id, text)
    setDraft('')
  }

  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-lg p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-corn-700/80 flex items-center justify-center flex-shrink-0">
          <span className="font-display text-[0.6875rem] font-bold text-white leading-none">
            {initials(question.author)}
          </span>
        </div>
        <div className="min-w-0">
          <div className="font-sans text-[0.8125rem] font-medium text-white/90 leading-tight">
            {question.author}
          </div>
        </div>
        <span className="ml-auto font-sans text-[10px] tracking-wide text-white/50 bg-white/6 border border-white/10 rounded-sm px-2 py-0.5 flex-shrink-0">
          {question.category}
        </span>
      </div>

      {/* Question text */}
      <p className="font-sans text-[0.9375rem] leading-[1.6] text-white/85 mb-4">{question.text}</p>

      {/* Actions — exactly 4: Approve, Disapprove, Report, Comment. Hidden for
          read-only (Google-preview) viewers per spec: public overview only. */}
      {!readOnly && (
      <div className="flex items-center gap-1 -ml-2">
        <button
          onClick={() => onVote(question.id, 'approve')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded font-sans text-[12px] transition-colors duration-150 ${
            question.myVote === 'approve' ? 'text-corn-500' : 'text-white/50 hover-white-tint hover:text-white/85'
          }`}
        >
          <ThumbsUp size={13} strokeWidth={1.8} />
          {question.approvals}
        </button>

        <button
          onClick={() => onVote(question.id, 'disapprove')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded font-sans text-[12px] transition-colors duration-150 ${
            question.myVote === 'disapprove' ? 'text-red-400' : 'text-white/50 hover-white-tint hover:text-white/85'
          }`}
        >
          <ThumbsDown size={13} strokeWidth={1.8} />
          {question.disapprovals}
        </button>

        <button
          onClick={() => onReport(question.id)}
          disabled={question.reported}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded font-sans text-[12px] transition-colors duration-150 disabled:opacity-50 ${
            question.reported ? 'text-white/40' : 'text-white/50 hover-white-tint hover:text-white/85'
          }`}
        >
          <Flag size={13} strokeWidth={1.8} />
          {question.reported ? 'Reported' : 'Report'}
        </button>

        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded font-sans text-[12px] text-white/50 hover-white-tint hover:text-white/85 transition-colors duration-150"
        >
          <MessageCircle size={13} strokeWidth={1.8} />
          {question.comments.length}
        </button>
      </div>
      )}

      {/* Comments */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-white/8 flex flex-col gap-3">
          {question.comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <span className="font-display text-[9px] font-bold text-white/80 leading-none">
                  {initials(c.author)}
                </span>
              </div>
              <div>
                <span className="font-sans text-[0.75rem] font-medium text-white/80">{c.author}</span>
                <p className="font-sans text-[0.8125rem] text-white/70 leading-snug">{c.text}</p>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-2 mt-1">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitComment()}
              placeholder="Write a comment…"
              className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-1.5 font-sans text-[0.8125rem] text-white/90 placeholder:text-white/35 focus:outline-none focus:border-white/25"
            />
            <button
              onClick={submitComment}
              className="font-sans text-[12px] font-semibold text-white/80 hover:text-white transition-colors px-2"
            >
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
