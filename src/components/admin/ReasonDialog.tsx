import * as React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LabelCaps } from '@/components/ui/label-caps'

// Shared reason-required confirmation used by every destructive moderation
// action (remove content, dismiss report, revoke role). A reason is
// mandatory — the confirm button stays disabled until non-empty text is
// entered, so "removal without a reason" is not a reachable UI state.
export function ReasonDialog({
  title,
  body,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
}: {
  title: string
  body?: React.ReactNode
  confirmLabel: string
  danger?: boolean
  onConfirm: (reason: string) => void
  onClose: () => void
}) {
  const [reason, setReason] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)

  function handleConfirm() {
    const trimmed = reason.trim()
    if (!trimmed) return
    setSubmitting(true)
    onConfirm(trimmed)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-[420px] bg-dark-100 border border-white/12 rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.5)] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <LabelCaps>{title}</LabelCaps>
          <button onClick={onClose} className="text-dark-muted hover:text-white transition-colors" aria-label="Close">
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        {body && <div className="font-sans text-[13px] text-dark-text mb-4">{body}</div>}

        <label className="font-sans text-[13px] text-dark-muted block mb-2">Reason — required, logged</label>
        <textarea
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded px-3 py-2.5 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25 resize-none mb-4"
          placeholder="Why this action — this is recorded in the moderation log"
        />

        <div className="flex justify-end gap-2">
          <Button variant="shell" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'accent'} size="sm" onClick={handleConfirm} disabled={!reason.trim() || submitting}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
