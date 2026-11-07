import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { AlertCircle, Loader2, MessageCircleQuestion, Send, Sparkles, WifiOff, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button, ButtonLink, Card, cx } from '@/components/ui'
import type { Problem, ProblemPart } from '@/types/problem'
import { askTutor, LIMITS, type ChatMessage, type TutorResult } from './api'

export interface TutorPanelProps {
  problem: Problem
  part: ProblemPart
  /** What the student typed as their answer, if anything; gives the tutor context. */
  studentAnswer?: string
}

type Notice = Exclude<TutorResult, { ok: true }>['reason'] | null

const STARTERS = ['Where do I start?', 'Can you check my approach?', 'What physics idea is this part about?']

const NOTICE_TEXT: Record<Exclude<Notice, null | 'offline' | 'limit_reached'>, string> = {
  session: 'Couldn’t start a tutor session. Refresh the page and try again.',
  unavailable: 'The tutor is unavailable right now. Please try again in a minute.',
  bad_request: 'That message couldn’t be sent. Try a shorter question.',
  network: 'Couldn’t reach the tutor. Check your connection and try again.',
}

export function TutorPanel({ problem, part, studentAnswer }: TutorPanelProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<Notice>(supabase ? null : 'offline')
  const [remaining, setRemaining] = useState<number | null>(null)

  const panelId = useId()
  const inputId = useId()
  const threadRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  // Bumped whenever the conversation is reset so late replies for an old problem are ignored.
  const conversation = useRef(0)

  useEffect(() => {
    conversation.current += 1
    setMessages([])
    setDraft('')
    setLoading(false)
    setNotice((n) => (n === 'offline' || n === 'limit_reached' ? n : null))
  }, [problem.id, part.id])

  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, loading])

  useEffect(() => {
    if (open && supabase) inputRef.current?.focus()
  }, [open])

  const limitReached = notice === 'limit_reached' || remaining === 0
  const canSend = !!supabase && !loading && !limitReached

  async function send(text: string) {
    const content = text.trim().slice(0, LIMITS.message)
    if (!content || !canSend) return
    const thread: ChatMessage[] = [...messages, { role: 'user', content }]
    const ticket = conversation.current
    setMessages(thread)
    setDraft('')
    setNotice(null)
    setLoading(true)

    const result = await askTutor({ problem, part, studentAnswer, messages: thread })
    if (ticket !== conversation.current) return
    setLoading(false)

    if (result.ok) {
      setMessages([...thread, { role: 'assistant', content: result.reply }])
      if (result.remainingToday !== null) setRemaining(result.remainingToday)
      return
    }
    // Take the unanswered question back out of the thread (the server expects
    // alternating turns) and return it to the box so nothing the student typed is lost.
    setMessages(messages)
    setDraft(content)
    setNotice(result.reason)
    if (result.remainingToday !== undefined) setRemaining(result.remainingToday)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void send(draft)
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      void send(draft)
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)} aria-expanded={false} aria-controls={panelId}>
        <MessageCircleQuestion size={16} aria-hidden="true" />
        Stuck? Ask the tutor
      </Button>
    )
  }

  return (
    <Card id={panelId} className="p-0">
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <Sparkles size={16} className="shrink-0 text-accent" aria-hidden="true" />
            AI tutor
          </h3>
          <p className="mt-0.5 text-xs text-muted">Hints first. Ask for the full solution once you’ve had a go.</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close tutor"
          aria-expanded={true}
          aria-controls={panelId}
          className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-surface2 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      {notice === 'offline' ? (
        <div className="flex items-start gap-3 px-4 py-5 text-sm text-muted">
          <WifiOff size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>
            The tutor isn’t connected in this preview. Hints and worked solutions on this page still work; the AI tutor
            turns on once the backend is set up.
          </p>
        </div>
      ) : (
        <>
          <div
            ref={threadRef}
            role="log"
            aria-live="polite"
            aria-label="Conversation with the tutor"
            className="max-h-[26rem] space-y-3 overflow-y-auto px-4 py-4"
          >
            {messages.length === 0 && !loading && (
              <div className="text-sm text-muted">
                <p>Tell the tutor what you tried or where you’re stuck on part ({part.id}). Or start with:</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={!canSend}
                      onClick={() => void send(s)}
                      className="rounded-full border border-border bg-surface2 px-3 py-1 text-xs font-medium text-text hover:border-accent/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={cx('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cx(
                    'max-w-[85%] whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-sm leading-relaxed',
                    m.role === 'user' ? 'bg-accent/15 text-text' : 'border border-border bg-surface2 text-text',
                  )}
                >
                  <span className="sr-only">{m.role === 'user' ? 'You: ' : 'Tutor: '}</span>
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                Tutor is thinking…
              </div>
            )}
          </div>

          <div className="border-t border-border px-4 py-3">
            {notice && notice !== 'limit_reached' && (
              <p role="alert" className="mb-3 flex items-start gap-2 text-sm text-bad">
                <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                {NOTICE_TEXT[notice]}
              </p>
            )}

            {limitReached ? (
              <div className="flex flex-col gap-3 rounded-lg border border-accent/40 bg-accent/5 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <p>
                  <span className="font-semibold">Today’s free tutor questions are used up.</span>{' '}
                  <span className="text-muted">They reset at midnight UTC. Pro includes unlimited tutoring.</span>
                </p>
                <ButtonLink to="/pro" className="shrink-0">
                  See Pro
                </ButtonLink>
              </div>
            ) : (
              <form onSubmit={onSubmit}>
                <label htmlFor={inputId} className="mb-1.5 block text-xs font-medium text-muted">
                  Your question
                </label>
                <div className="flex items-end gap-2">
                  <textarea
                    id={inputId}
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={onKeyDown}
                    rows={2}
                    maxLength={LIMITS.message}
                    placeholder="e.g. I drew the forces but I’m not sure which way friction points"
                    className="min-w-0 flex-1 resize-y rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                  <Button type="submit" disabled={!canSend || !draft.trim()} aria-label="Send question" className="shrink-0 px-3">
                    {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
                    <span className="hidden sm:inline">Send</span>
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted">
                  {remaining !== null
                    ? `${remaining} ${remaining === 1 ? 'question' : 'questions'} left today`
                    : 'Free accounts get a few tutor questions each day.'}
                  <span className="hidden sm:inline"> · Enter to send, Shift+Enter for a new line</span>
                </p>
              </form>
            )}
          </div>
        </>
      )}
    </Card>
  )
}
