import * as React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LabelCaps } from '@/components/ui/label-caps'

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
    // Same mobile-vs-desktop split as NewQuestionDialog: viewport-fixed with
    // side insets below sm: (a right-anchored 360px popover has ~15px of
    // margin left on a 375px viewport, which overflows in practice once the
    // trigger isn't flush with the container's right edge), original
    // right-anchored popover from sm: up.
    <div className="fixed inset-x-4 top-20 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 z-40 sm:w-[360px] max-h-[calc(100vh-6rem)] overflow-y-auto bg-dark-100 border border-white/12 rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.5)] p-5">
      <div className="flex items-center justify-between mb-3">
        <LabelCaps>Endorse {targetName}</LabelCaps>
        <button onClick={onClose} className="text-dark-muted hover:text-white transition-colors" aria-label="Close">
          <X size={16} strokeWidth={1.8} />
        </button>
      </div>

      <label className="font-sans text-[11px] text-dark-muted block mb-2">
        Why? (visible to {targetName.split(' ')[0]} — required)
      </label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2.5 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25 resize-none mb-4"
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
