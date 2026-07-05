import * as React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Same "no overlay dimming" modal pattern as community/NewQuestionDialog.tsx —
// consistent behavior for every custom dialog in the app. Reason is
// mandatory: an endorsement without one isn't allowed to submit, per spec.
export function EndorseDialog({
  targetName,
  onSubmit,
  onClose,
}: {
  targetName: string
  onSubmit: (reason: string) => void
  onClose: () => void
}) {
  const [reason, setReason] = React.useState('')

  function handleSubmit() {
    const trimmed = reason.trim()
    if (!trimmed) return
    onSubmit(trimmed)
  }

  return (
    <div className="absolute right-0 top-full mt-2 z-40 w-[360px] bg-dark-100 border border-white/12 rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.5)] p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="font-sans text-[11px] font-medium tracking-[0.16em] uppercase text-white/45">
          Endorse {targetName}
        </span>
        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors" aria-label="Close">
          <X size={16} strokeWidth={1.8} />
        </button>
      </div>

      <label className="font-sans text-[11px] text-white/50 block mb-2">
        Why? (visible to {targetName.split(' ')[0]} — required)
      </label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2.5 font-sans text-[0.8125rem] text-white/90 placeholder:text-white/35 focus:outline-none focus:border-white/25 resize-none mb-4"
        placeholder="e.g. Paired with them on X — they clearly know Y because..."
      />

      <div className="flex justify-end gap-2">
        <Button variant="shell" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="accent" size="sm" onClick={handleSubmit} disabled={!reason.trim()}>
          Endorse
        </Button>
      </div>
    </div>
  )
}
