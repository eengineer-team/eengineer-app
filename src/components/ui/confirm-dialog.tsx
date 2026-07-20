import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LabelCaps } from '@/components/ui/label-caps'

// Same "no overlay dimming" popover pattern as EndorseDialog/ProjectFeedbackDialog
// — the one shared place every delete confirmation in the app should go through,
// so a bare icon never destroys something with zero confirmation. Callers
// position it (wrap the trigger in `relative`, or pass `className` for a
// different anchor) the same way ProjectFeedbackDialog's callers do.
export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Delete',
  onConfirm,
  onClose,
  className,
}: {
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  onClose: () => void
  className?: string
}) {
  return (
    <div
      className={
        className ??
        'fixed inset-x-4 top-20 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 z-40 sm:w-[340px] max-h-[calc(100vh-6rem)] overflow-y-auto bg-dark-100 border border-white/12 rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.5)] p-5'
      }
    >
      <div className="flex items-center justify-between mb-3">
        <LabelCaps>{title}</LabelCaps>
        <button onClick={onClose} className="text-dark-muted hover:text-white transition-colors" aria-label="Close">
          <X size={16} strokeWidth={1.8} />
        </button>
      </div>

      <p className="font-sans text-[0.8125rem] leading-snug text-white/70 mb-4">{description}</p>

      <div className="flex justify-end gap-2">
        <Button variant="shell" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" size="sm" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  )
}
