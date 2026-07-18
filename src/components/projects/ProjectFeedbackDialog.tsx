import * as React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LabelCaps } from '@/components/ui/label-caps'

// Same "no overlay dimming" popover pattern as EndorseDialog/NewQuestionDialog
// — text is required, same as an endorsement reason: feedback without any
// content isn't allowed to submit.
export function ProjectFeedbackDialog({
  projectName,
  onSubmit,
  onClose,
}: {
  projectName: string
  onSubmit: (text: string) => void
  onClose: () => void
}) {
  const [text, setText] = React.useState('')

  function handleSubmit() {
    const trimmed = text.trim()
    if (!trimmed) return
    onSubmit(trimmed)
  }

  return (
    <div className="fixed inset-x-4 top-20 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 z-40 sm:w-[380px] max-h-[calc(100vh-6rem)] overflow-y-auto bg-dark-100 border border-white/12 rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.5)] p-5">
      <div className="flex items-center justify-between mb-3">
        <LabelCaps>Feedback for {projectName}</LabelCaps>
        <button onClick={onClose} className="text-dark-muted hover:text-white transition-colors" aria-label="Close">
          <X size={16} strokeWidth={1.8} />
        </button>
      </div>

      <label className="font-sans text-[11px] text-dark-muted block mb-2">
        Visible to the project owner — required
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2.5 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25 resize-none mb-4"
        placeholder="What stood out, what would make it better, questions you'd ask..."
      />

      <div className="flex justify-end gap-2">
        <Button variant="shell" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="accent" size="sm" onClick={handleSubmit} disabled={!text.trim()}>
          Send feedback
        </Button>
      </div>
    </div>
  )
}
