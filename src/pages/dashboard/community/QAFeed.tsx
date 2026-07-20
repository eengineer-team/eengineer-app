import * as React from 'react'
import { Send, AlertTriangle } from 'lucide-react'
import type { Discipline, Question } from '@/lib/community-data'
import { textSimilarity, DUPLICATE_THRESHOLD } from '@/lib/similarity'
import { QuestionCard } from '@/components/community/QuestionCard'
import { supabase } from '@/lib/supabase'
import * as api from '@/lib/api/community'
import { errorDetail } from '@/lib/utils'

// Telegram-groupchat-style feed (per founder feedback) — continuous message
// list with a persistent composer at the bottom. Live-backed by Supabase:
// fetches on mount, subscribes to Realtime on questions/question_votes/
// question_comments so a vote or reply from another Builder shows up without
// a manual refresh, and reconciles optimistic updates against the server.
export function QAFeed({ readOnly = false, discipline }: { readOnly?: boolean; discipline?: Discipline }) {
  const [questions, setQuestions] = React.useState<Question[]>([])
  const [draft, setDraft] = React.useState('')
  const [duplicate, setDuplicate] = React.useState<Question | null>(null)
  const [postError, setPostError] = React.useState<string | null>(null)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)
  const uidRef = React.useRef<string | null>(null)
  const visible = discipline ? questions.filter((q) => q.category === discipline) : questions

  const refresh = React.useCallback(async () => {
    uidRef.current = await api.currentUid()
    try {
      setQuestions(await api.fetchQuestions())
    } catch (err) {
      // Supabase/PostgREST rejects with a plain object, which console.error
      // renders as a useless bare "Object" — stringify so the code and hint
      // are actually readable.
      console.error('Failed to load the Q&A feed:', JSON.stringify(err, null, 2))
    }
  }, [])

  React.useEffect(() => {
    let cancelled = false
    let channel: ReturnType<typeof supabase.channel> | null = null

    // Realtime evaluates the RLS policy on every row using whatever token the
    // websocket currently holds. Every Q&A policy requires app.is_builder(),
    // which reads user_status off the JWT — so if we subscribe before the
    // session is restored, the socket is still on the anon key, the channel
    // reports SUBSCRIBED, and then silently delivers nothing forever. Waiting
    // for the session (and pushing the token onto the socket) is what makes
    // the subscription actually receive rows.
    async function connect() {
      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      if (data.session) await supabase.realtime.setAuth(data.session.access_token)
      if (cancelled) return

      channel = supabase
        .channel(`qa-feed-${discipline ?? 'all'}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, () => void refresh())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'question_votes' }, () => void refresh())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'question_comments' }, () => void refresh())
        // A failing channel used to be completely invisible: .subscribe() was
        // called with no callback, so a transport error looked identical to a
        // working feed with no new posts.
        .subscribe((status, err) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.error(`Q&A realtime channel ${status}`, err ?? '')
          }
        })
    }

    void refresh()
    void connect()

    // Signing in issues a new JWT, and the old socket is still bound to the
    // previous one — tear down and reconnect so RLS is re-evaluated with it.
    // Everything here is deferred out of the callback: both refresh() and
    // connect() call auth methods, and supabase-js holds a lock while it
    // dispatches this event — calling in deadlocks the client.
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
  }, [refresh, discipline])

  function handleVote(id: string, vote: 'approve' | 'disapprove') {
    const uid = uidRef.current
    if (!uid) return
    const target = questions.find((q) => q.id === id)
    if (!target) return
    const currentVote = target.myVote

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
    api.voteQuestion(uid, id, vote, currentVote).catch((err) => {
      console.error('Vote failed', err)
      void refresh()
    })
  }

  // See api/community.ts reportQuestion: the report queue is staff-only, so
  // this flips "Reported" locally for the reporter — it can't be re-read
  // from the server and won't survive a refresh, by design.
  function handleReport(id: string) {
    const uid = uidRef.current
    if (!uid) return
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, reported: true } : q)))
    api.reportQuestion(uid, id).catch((err) => console.error('Report failed', err))
  }

  function handleComment(id: string, text: string) {
    const uid = uidRef.current
    if (!uid) return
    api.commentQuestion(uid, id, text).catch((err) => {
      console.error('Comment failed', err)
      void refresh()
    })
  }

  // Optimistic removal, restored (with a visible error, not a swallowed one)
  // if the delete actually fails server-side.
  function handleDeleteQuestion(id: string) {
    setDeleteError(null)
    const previous = questions
    setQuestions((prev) => prev.filter((q) => q.id !== id))
    api.deleteQuestion(id).catch((err) => {
      setQuestions(previous)
      const detail = errorDetail(err)
      setDeleteError(detail ? `Couldn't delete: ${detail}` : "Couldn't delete that message.")
    })
  }

  function handleDeleteComment(id: string) {
    setDeleteError(null)
    const previous = questions
    setQuestions((prev) =>
      prev.map((q) => ({ ...q, comments: q.comments.filter((c) => c.id !== id) }))
    )
    api.deleteQuestionComment(id).catch((err) => {
      setQuestions(previous)
      const detail = errorDetail(err)
      setDeleteError(detail ? `Couldn't delete: ${detail}` : "Couldn't delete that reply.")
    })
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
    setPostError(null)
    const uid = uidRef.current
    // Used to `return` silently here, so pressing Send before the session
    // resolved looked exactly like a dead button.
    if (!uid) {
      setPostError('Still signing you in — try again in a moment.')
      return
    }

    if (!duplicate) {
      const found = findDuplicate(text)
      if (found) {
        setDuplicate(found)
        return
      }
    }

    setDraft('')
    setDuplicate(null)
    api.postQuestion(uid, discipline ?? 'Other', text).catch((err: unknown) => {
      console.error('Post failed', err)
      // Put the draft back rather than silently eating what they typed.
      setDraft(text)
      const detail = errorDetail(err)
      setPostError(detail ? `Couldn't post: ${detail}` : "Couldn't post your message.")
      void refresh()
    })
  }

  return (
    <div className="flex flex-col">
      {deleteError && (
        <p className="font-sans text-[0.8125rem] text-red-400 pt-2" role="alert">
          {deleteError}
        </p>
      )}
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
              onDeleteQuestion={handleDeleteQuestion}
              onDeleteComment={handleDeleteComment}
            />
          ))
        )}
      </div>

      {/* Composer — persistent, Telegram-style. Hidden for read-only
          (Google-preview) viewers, same as the old "Ask a question" gate. */}
      {!readOnly && (
        <div className="pt-3 border-t border-white/8">
          {postError && (
            <p className="font-sans text-[0.8125rem] text-red-400 mb-3" role="alert">
              {postError}
            </p>
          )}
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
                    className="font-sans text-[13px] font-semibold text-corn-500 hover:brightness-110 transition-all"
                  >
                    Post anyway
                  </button>
                  <button
                    onClick={() => setDuplicate(null)}
                    className="font-sans text-[13px] text-dark-muted hover:text-white/80 transition-colors"
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
