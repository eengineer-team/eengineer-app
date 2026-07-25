import * as React from 'react'
import { createPortal } from 'react-dom'
import { Star, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LabelCaps } from '@/components/ui/label-caps'
import { cn } from '@/lib/utils'

// Real feedback submission (rating + message), reachable from the
// permanently-visible "Feedback" entry in the sidebar. Writes to the
// feedback table -- see supabase/migrations/20260721200000_feedback.sql
// and api/feedback.ts. Read back in the internal panel at
// /internal/feedback (InternalFeedback.tsx), not via SQL any more.
export function FeedbackDialog({
  submitting,
  error,
  onSubmit,
  onClose,
}: {
  submitting: boolean
  error: string | null
  onSubmit: (rating: number, message: string) => void
  onClose: () => void
}) {
  const [rating, setRating] = React.useState(0)
  const [hoverRating, setHoverRating] = React.useState(0)
  const [message, setMessage] = React.useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = message.trim()
    if (!rating || !trimmed) return
    onSubmit(rating, trimmed)
  }

  const canSubmit = rating > 0 && message.trim().length > 0 && !submitting
  const displayRating = hoverRating || rating

  // Portal straight to <body>. The trigger lives in DashboardHeader, which
  // has `backdrop-blur-sm` (a CSS filter) -- per spec, an element with a
  // filter/backdrop-filter becomes the containing block for any `position:
  // fixed` descendant, so without the portal this dialog was positioning
  // itself relative to the ~76px-tall header bar instead of the viewport,
  // which is why it rendered mostly off-screen on every screen size.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={submitting ? undefined : onClose}
        aria-hidden="true"
      />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-[420px] max-h-full overflow-y-auto bg-dark-100 border border-white/12 rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.5)] p-5"
      >
        <div className="flex items-center justify-between mb-1">
          <LabelCaps>Share feedback</LabelCaps>
          <button
            type="button"
            onClick={onClose}
            className="text-dark-muted hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>
        <p className="font-sans text-[0.75rem] text-dark-muted mb-4">
          Tell us what's working and what isn't — we read every submission.
        </p>

        <div className="flex flex-col gap-3 mb-4">
          <div>
            <LabelCaps className="block mb-1.5">Rating</LabelCaps>
            <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  className="p-0.5"
                >
                  <Star
                    size={22}
                    strokeWidth={1.8}
                    className={cn(
                      'transition-colors',
                      n <= displayRating ? 'fill-gold-dark text-gold-dark' : 'text-dark-muted'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <LabelCaps className="block mb-1.5">Comments</LabelCaps>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2.5 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25 resize-none"
              placeholder="What's working, what's confusing, what you wish existed…"
            />
          </div>
        </div>

        {error && (
          <p className="font-sans text-[0.8125rem] text-red-400 mb-3" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="shell" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="accent" size="sm" disabled={!canSubmit}>
            {submitting ? 'Sending…' : 'Send feedback'}
          </Button>
        </div>
      </form>
    </div>,
    document.body
  )
}
