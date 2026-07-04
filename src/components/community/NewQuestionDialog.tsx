import * as React from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { DISCIPLINES, type Discipline, type Question } from '@/lib/community-data'
import { textSimilarity, DUPLICATE_THRESHOLD } from '@/lib/similarity'
import { Button } from '@/components/ui/button'

// Intentionally NOT a Radix Dialog — spec calls for a modal with no overlay
// dimming, so this is a plain fixed-position panel anchored below the trigger.
export function NewQuestionDialog({
  existingQuestions,
  onSubmit,
  onClose,
}: {
  existingQuestions: Question[]
  onSubmit: (category: Discipline, text: string) => void
  onClose: () => void
}) {
  const [category, setCategory] = React.useState<Discipline>(DISCIPLINES[0])
  const [text, setText] = React.useState('')
  const [duplicate, setDuplicate] = React.useState<Question | null>(null)

  function findDuplicate(): Question | null {
    let best: Question | null = null
    let bestScore = 0
    for (const q of existingQuestions) {
      const score = textSimilarity(text, q.text)
      if (score > bestScore) {
        bestScore = score
        best = q
      }
    }
    return bestScore >= DUPLICATE_THRESHOLD ? best : null
  }

  function handleSubmit() {
    const trimmed = text.trim()
    if (!trimmed) return

    // First attempt: check for a duplicate. If one surfaces and the user
    // hasn't already seen and dismissed this exact warning, stop and warn.
    if (!duplicate) {
      const found = findDuplicate()
      if (found) {
        setDuplicate(found)
        return
      }
    }

    onSubmit(category, trimmed)
  }

  return (
    <div className="absolute right-0 top-full mt-2 z-40 w-[420px] bg-dark-100 border border-white/12 rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.5)] p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="font-sans text-[11px] font-medium tracking-[0.16em] uppercase text-white/45">
          New question
        </span>
        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors" aria-label="Close">
          <X size={16} strokeWidth={1.8} />
        </button>
      </div>

      {/* Likely category */}
      <div className="mb-4">
        <label className="font-sans text-[11px] text-white/50 block mb-2">Likely category</label>
        <div className="flex flex-wrap gap-1.5">
          {DISCIPLINES.map((d) => (
            <button
              key={d}
              onClick={() => setCategory(d)}
              className={`font-sans text-[11px] rounded-sm px-2.5 py-1 border transition-colors duration-150 ${
                category === d
                  ? 'bg-white/12 border-white/25 text-white'
                  : 'border-white/10 text-white/55 hover:text-white/85 hover:border-white/20'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Question text */}
      <div className="mb-2">
        <label className="font-sans text-[11px] text-white/50 block mb-2">Type your question below</label>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setDuplicate(null)
          }}
          rows={4}
          className="w-full bg-white/5 border border-white/10 rounded px-3 py-2.5 font-sans text-[0.875rem] text-white/90 placeholder:text-white/35 focus:outline-none focus:border-white/25 resize-none"
          placeholder="What are you stuck on?"
        />
      </div>

      {/* Duplicate warning */}
      {duplicate && (
        <div className="mb-4 flex gap-2.5 bg-corn-700/10 border border-corn-700/30 rounded p-3">
          <AlertTriangle size={14} strokeWidth={1.8} className="text-corn-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-sans text-[0.75rem] text-white/80 leading-snug mb-1">
              This looks similar to an existing question:
            </p>
            <p className="font-sans text-[0.8125rem] text-white/60 leading-snug italic">"{duplicate.text}"</p>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="shell" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="accent" size="sm" onClick={handleSubmit} disabled={!text.trim()}>
          {duplicate ? 'Post anyway' : 'Post question'}
        </Button>
      </div>
    </div>
  )
}
