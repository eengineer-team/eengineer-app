import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { BookOpen, CircleAlert, CircleCheck, CircleX, Lightbulb } from 'lucide-react'
import type { Problem, ProblemPart } from '@/types/problem'
import { Button, cx } from '@/components/ui'
import { TutorPanel } from '@/features/tutor/TutorPanel'
import { checkChoice, checkNumeric, formatNumber, type CheckStatus, type NumericCheck } from './check-answer'
import { markPartSolved, partKey, useSolvedParts } from './progress'

type Feedback =
  | { kind: 'numeric'; result: NumericCheck }
  | { kind: 'choice'; status: CheckStatus }

/** One part of a problem: prompt, answer input, check, hint, solution and the AI tutor. */
export function PartCard({ problem, part }: { problem: Problem; part: ProblemPart }) {
  const uid = useId()
  const solvedSet = useSolvedParts()
  const solvedBefore = solvedSet.has(partKey(problem.id, part.id))

  const [text, setText] = useState('')
  const [choice, setChoice] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [wrongAttempts, setWrongAttempts] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [showSolution, setShowSolution] = useState(false)
  const [nudge, setNudge] = useState(false)
  const [nudgedOnce, setNudgedOnce] = useState(false)

  const answer = part.answer
  const studentAnswer =
    answer.kind === 'numeric' ? text.trim() : choice !== null ? answer.options[choice] : ''

  const onCheck = (e: FormEvent) => {
    e.preventDefault()
    let status: CheckStatus
    if (answer.kind === 'numeric') {
      const result = checkNumeric(text, answer)
      status = result.status
      setFeedback({ kind: 'numeric', result })
    } else {
      status = checkChoice(choice, answer)
      setFeedback({ kind: 'choice', status })
    }
    if (status === 'correct') {
      markPartSolved(problem.id, part.id)
      setNudge(false)
    } else if (status === 'incorrect') {
      setWrongAttempts((n) => n + 1)
    }
  }

  const onShowSolution = () => {
    if (showSolution) {
      setShowSolution(false)
      return
    }
    // After a wrong attempt, nudge toward the hint (or tutor) once before revealing everything.
    if (wrongAttempts > 0 && !nudgedOnce && !solvedBefore && !(part.hint && showHint)) {
      setNudge(true)
      setNudgedOnce(true)
      return
    }
    setNudge(false)
    setShowSolution(true)
  }

  const clearFeedback = () => setFeedback(null)

  const status = feedback ? (feedback.kind === 'numeric' ? feedback.result.status : feedback.status) : null

  return (
    <section
      aria-labelledby={`${uid}-title`}
      className="rounded-lg border border-border bg-surface p-4 sm:p-6"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 id={`${uid}-title`} className="font-display text-lg font-bold">
          Part ({part.id})
        </h3>
        {solvedBefore && (
          <span className="inline-flex items-center gap-1 rounded-full border border-good/40 px-2 py-0.5 text-xs font-medium text-good">
            <CircleCheck size={12} aria-hidden="true" /> Solved
          </span>
        )}
      </div>
      <p className="whitespace-pre-line break-words leading-relaxed">{part.prompt}</p>

      <form onSubmit={onCheck} className="mt-5" noValidate>
        {answer.kind === 'numeric' ? (
          <div>
            <label htmlFor={`${uid}-input`} className="mb-1.5 block text-sm font-semibold">
              Your answer{answer.unit ? <span className="font-normal text-muted"> (in {answer.unit})</span> : null}
            </label>
            <div className="flex flex-wrap gap-2">
              <div
                className={cx(
                  'flex min-w-0 flex-1 items-center rounded-lg border bg-bg focus-within:outline focus-within:outline-2 focus-within:outline-accent sm:max-w-xs',
                  status === 'correct' ? 'border-good' : status === 'incorrect' || status === 'invalid' ? 'border-bad' : 'border-border',
                )}
              >
                <input
                  id={`${uid}-input`}
                  type="text"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value)
                    clearFeedback()
                  }}
                  placeholder="e.g. 12.4 or 1.2e3"
                  aria-describedby={`${uid}-fb`}
                  aria-invalid={status === 'incorrect' || status === 'invalid' ? true : undefined}
                  className="min-w-0 flex-1 bg-transparent px-3 py-2 font-mono text-text outline-none placeholder:text-muted/60"
                />
                {answer.unit && (
                  <span className="shrink-0 border-l border-border px-3 py-2 font-mono text-sm text-muted" aria-hidden="true">
                    {answer.unit}
                  </span>
                )}
              </div>
              <Button type="submit">Check</Button>
            </div>
          </div>
        ) : (
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Choose one</legend>
            <div className="space-y-2">
              {answer.options.map((opt, i) => {
                const selected = choice === i
                const tone = selected && status === 'correct' ? 'good' : selected && status === 'incorrect' ? 'bad' : null
                return (
                  <label
                    key={i}
                    className={cx(
                      'flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-accent',
                      tone === 'good'
                        ? 'border-good bg-good/10'
                        : tone === 'bad'
                          ? 'border-bad bg-bad/10'
                          : selected
                            ? 'border-accent bg-accent/10'
                            : 'border-border bg-bg hover:bg-surface2',
                    )}
                  >
                    <input
                      type="radio"
                      name={`${uid}-choice`}
                      value={i}
                      checked={selected}
                      onChange={() => {
                        setChoice(i)
                        clearFeedback()
                      }}
                      className="mt-1 shrink-0 accent-accent"
                    />
                    <span className="min-w-0 break-words">
                      <span className="mr-1.5 font-mono text-sm text-muted">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                    </span>
                  </label>
                )
              })}
            </div>
            <Button type="submit" className="mt-3">
              Check
            </Button>
          </fieldset>
        )}

        <div id={`${uid}-fb`} role="status" aria-live="polite" className="mt-3 empty:hidden">
          {feedback && <FeedbackMessage feedback={feedback} part={part} />}
        </div>
      </form>

      <div className="mt-5 flex flex-wrap gap-2">
        {part.hint && (
          <Button
            variant="secondary"
            aria-expanded={showHint}
            aria-controls={`${uid}-hint`}
            onClick={() => {
              setShowHint((v) => !v)
              setNudge(false)
            }}
          >
            <Lightbulb size={16} aria-hidden="true" /> {showHint ? 'Hide hint' : 'Hint'}
          </Button>
        )}
        <Button variant="secondary" aria-expanded={showSolution} aria-controls={`${uid}-solution`} onClick={onShowSolution}>
          <BookOpen size={16} aria-hidden="true" /> {showSolution ? 'Hide solution' : 'Show solution'}
        </Button>
      </div>

      {nudge && (
        <div className="mt-3 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm" role="status">
          <p>
            {part.hint
              ? 'Not quite yet. Try the hint first: one nudge is often all you need.'
              : 'Not quite yet. Try asking the tutor below for a nudge before reading the full solution.'}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {part.hint && (
              <Button
                className="px-3 py-1.5"
                onClick={() => {
                  setShowHint(true)
                  setNudge(false)
                }}
              >
                <Lightbulb size={14} aria-hidden="true" /> Show hint
              </Button>
            )}
            <Button
              variant="ghost"
              className="px-3 py-1.5"
              onClick={() => {
                setNudge(false)
                setShowSolution(true)
              }}
            >
              Show solution anyway
            </Button>
          </div>
        </div>
      )}

      {part.hint && showHint && (
        <div id={`${uid}-hint`} className="mt-3 flex gap-2 rounded-lg border border-border bg-surface2 p-3 text-sm">
          <Lightbulb size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
          <p className="min-w-0 whitespace-pre-line break-words">{part.hint}</p>
        </div>
      )}

      {showSolution && (
        <div id={`${uid}-solution`} className="mt-4 rounded-lg border border-border bg-bg p-4">
          <h4 className="mb-3 font-display font-bold">Solution</h4>
          <ol className="space-y-4">
            {part.solution.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 font-mono text-xs font-semibold text-accent"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold">{step.title}</p>
                  <p className="mt-1 whitespace-pre-line break-words leading-relaxed text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-4 border-t border-border pt-3 text-sm">
            <span className="text-muted">Answer: </span>
            <span className="font-mono font-semibold">
              {answer.kind === 'numeric'
                ? `${formatNumber(answer.value)}${answer.unit ? ` ${answer.unit}` : ''}`
                : `${String.fromCharCode(65 + answer.correctIndex)}. ${answer.options[answer.correctIndex]}`}
            </span>
          </p>
        </div>
      )}

      <div className="mt-6 border-t border-border pt-5">
        <TutorPanel problem={problem} part={part} studentAnswer={studentAnswer || undefined} />
      </div>
    </section>
  )
}

function FeedbackMessage({ feedback, part }: { feedback: Feedback; part: ProblemPart }) {
  const answer = part.answer
  const status = feedback.kind === 'numeric' ? feedback.result.status : feedback.status
  const unit = answer.kind === 'numeric' ? answer.unit : ''

  if (status === 'empty') {
    return (
      <Message tone="muted" icon={<CircleAlert size={16} aria-hidden="true" />}>
        {answer.kind === 'numeric' ? 'Type an answer first.' : 'Pick an option first.'}
      </Message>
    )
  }
  if (status === 'invalid') {
    return (
      <Message tone="bad" icon={<CircleAlert size={16} aria-hidden="true" />}>
        That does not read as a number. Try a format like 12.4, -3, 1.2e3 or 1.2×10^3.
      </Message>
    )
  }

  const unitNote =
    feedback.kind === 'numeric' && feedback.result.unitMismatch && unit
      ? ` Heads up: the answer is checked in ${unit}, and you wrote “${feedback.result.parsed?.unit}”.`
      : ''

  if (status === 'correct') {
    return (
      <Message tone="good" icon={<CircleCheck size={16} aria-hidden="true" />}>
        <strong>Correct!</strong>
        {answer.kind === 'numeric' && (
          <>
            {' '}
            Expected {formatNumber(answer.value)}
            {unit ? ` ${unit}` : ''}
            {answer.tolerancePct > 0 ? ` (within ±${answer.tolerancePct}%)` : ''}.
          </>
        )}
        {unitNote}
      </Message>
    )
  }
  return (
    <Message tone="bad" icon={<CircleX size={16} aria-hidden="true" />}>
      <strong>Not quite.</strong>{' '}
      {answer.kind === 'numeric'
        ? `Check your work and try again. The answer is in ${unit || 'no unit (dimensionless)'}.`
        : 'Try again, or open the hint.'}
      {unitNote}
    </Message>
  )
}

function Message({ tone, icon, children }: { tone: 'good' | 'bad' | 'muted'; icon: ReactNode; children: ReactNode }) {
  return (
    <p
      className={cx(
        'flex items-start gap-2 rounded-lg border px-3 py-2 text-sm',
        tone === 'good' && 'border-good/40 bg-good/10 text-good',
        tone === 'bad' && 'border-bad/40 bg-bad/10 text-bad',
        tone === 'muted' && 'border-border bg-surface2 text-muted',
      )}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="min-w-0">{children}</span>
    </p>
  )
}
