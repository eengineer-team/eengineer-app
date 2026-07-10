import * as React from 'react'
import { Send, AlertTriangle } from 'lucide-react'
import { SEED_QUESTIONS, type Discipline, type Question } from '@/lib/community-data'
import { textSimilarity, DUPLICATE_THRESHOLD } from '@/lib/similarity'
import { QuestionCard } from '@/components/community/QuestionCard'
import { usePersistentState } from '@/lib/use-persistent-state'

let nextId = SEED_QUESTIONS.length + 1

// Telegram-groupchat-style feed (per founder feedback) — continuous message
// list with a persistent composer at the bottom, replacing the old "Ask a
// question" button + popup dialog. Same underlying rules as before (vote /
// report / comment, duplicate-check before posting) — just presented as a
// running conversation instead of a stack of standalone cards.
export function QAFeed({ readOnly = false, discipline }: { readOnly?: boolean; discipline?: Discipline }) {
  const [questions, setQuestions] = usePersistentState<Question[]>('ee:qa-feed', SEED_QUESTIONS)
  const [draft, setDraft] = React.useState('')
  const [duplicate, setDuplicate] = React.useState<Question | null>(null)
  const visible = discipline ? questions.filter((q) => q.category === discipline) : questions

  function handleVote(id: string, vote: 'approve' | 'disapprove') {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q
        const wasVote = q.myVote
        let approvals = q.approvals
        let disapprovals = q.disapprovals

        if (wasVote === 'approve') approvals--
        if (wasVote === 'disapprove') disapprovals--

        const nextVote = wasVote === vote ? null : vote
        if (nextVote === 'approve') approvals++
        if (nextVote === 'disapprove') disapprovals++

        return { ...q, approvals, disapprovals, myVote: nextVote }
      })
    )
  }

  function handleReport(id: string) {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, reported: true } : q)))
  }

  function handleComment(id: string, text: string) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id
          ? { ...q, comments: [...q.comments, { id: `c-${Date.now()}`, author: 'You', text, time: 'Just now' }] }
          : q
      )
    )
  }

  function findDuplicate(text: string): Question | null {
    let best: Question | null = null
    let bestScore = 0
    for (const q of visible) {
      const score = textSimilarity(text, q.text)
      if (score > bestScore) {
        bestScore = score
        best = q
      }
    }
    return bestScore >= DUPLICATE_THRESHOLD ? best : null
  }

  function send() {
    const text = draft.trim()
    if (!text) return

    if (!duplicate) {
      const found = findDuplicate(text)
      if (found) {
        setDuplicate(found)
        return
      }
    }

    const question: Question = {
      id: `q-${nextId++}`,
      category: discipline ?? 'Other',
      text,
      author: 'You',
      time: 'Just now',
      approvals: 0,
      disapprovals: 0,
      myVote: null,
      reported: false,
      comments: [],
    }
    setQuestions((prev) => [...prev, question])
    setDraft('')
    setDuplicate(null)
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 flex flex-col gap-0.5 pt-2 pb-4 min-h-[200px]">
        {visible.length === 0 ? (
          <p className="font-sans text-[0.8125rem] text-dark-muted">
            {discipline ? `No messages yet in ${discipline} — be the first to post.` : 'No messages yet.'}
          </p>
        ) : (
          visible.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              readOnly={readOnly}
              onVote={handleVote}
              onReport={handleReport}
              onComment={handleComment}
            />
          ))
        )}
      </div>

      {/* Composer — persistent, Telegram-style. Hidden for read-only
          (Google-preview) viewers, same as the old "Ask a question" gate. */}
      {!readOnly && (
        <div className="pt-3 border-t border-white/8">
          {duplicate && (
            <div className="flex gap-2.5 bg-corn-700/10 border border-corn-700/30 rounded p-3 mb-3">
              <AlertTriangle size={14} strokeWidth={1.8} className="text-corn-500 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-sans text-[0.75rem] text-white/80 leading-snug mb-1">
                  This looks similar to an existing message:
                </p>
                <p className="font-sans text-[0.8125rem] text-white/60 leading-snug italic mb-2">"{duplicate.text}"</p>
                <div className="flex gap-2">
                  <button
                    onClick={send}
                    className="font-sans text-[11px] font-semibold text-corn-500 hover:brightness-110 transition-all"
                  >
                    Post anyway
                  </button>
                  <button
                    onClick={() => setDuplicate(null)}
                    className="font-sans text-[11px] text-dark-muted hover:text-white/80 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value)
                setDuplicate(null)
              }}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder={discipline ? `Message ${discipline}…` : 'Write a message…'}
              className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded px-3.5 py-2.5 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25"
            />
            <button
              onClick={send}
              disabled={!draft.trim()}
              aria-label="Send"
              className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded bg-gold-dark text-dark-900 hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none transition-all"
            >
              <Send size={14} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
