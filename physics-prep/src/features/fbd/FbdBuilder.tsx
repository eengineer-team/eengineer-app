import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Compass,
  Eye,
  EyeOff,
  Lightbulb,
  Plus,
  RotateCcw,
  RotateCw,
  Ruler,
  Tag,
  Trash2,
  XCircle,
} from 'lucide-react'
import { Badge, Button, Card, Container, cx } from '@/components/ui'
import { checkDiagram, type CheckResult, type FeedbackKind } from './check'
import { DiagramCanvas } from './DiagramCanvas'
import {
  ANGLE_STEP,
  FORCE_INFO,
  FORCE_ORDER,
  LENGTH_DEFAULT,
  LENGTH_MAX,
  LENGTH_MIN,
  directionWord,
  lengthWord,
  normalizeAngle,
  snapAngle,
  type ForceType,
  type PlacedForce,
} from './forces'
import { SCENARIOS, type Scenario } from './scenarios'
import { ScenarioScene } from './ScenarioScene'
import { RichText } from './svg'

// New arrows start pointing in directions that are wrong for every scenario, so the student has to aim them.
const START_ANGLES = [120, 210, 315, 240, 0]

export function FbdBuilder({ scenario }: { scenario: Scenario }) {
  const [forces, setForces] = useState<PlacedForce[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [stale, setStale] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const added = useRef(0)

  const selected = forces.find((f) => f.id === selectedId) ?? null

  function change(next: (prev: PlacedForce[]) => PlacedForce[]) {
    setForces(next)
    if (result) setStale(true)
  }

  function addForce(type: ForceType) {
    const n = added.current++
    const id = `f${n + 1}`
    const force: PlacedForce = {
      id,
      type,
      angle: START_ANGLES[n % START_ANGLES.length],
      length: LENGTH_DEFAULT,
      label: FORCE_INFO[type].label,
    }
    change((prev) => [...prev, force])
    setSelectedId(id)
  }

  function updateForce(id: string, patch: Partial<PlacedForce>) {
    change((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  }

  function removeForce(id: string) {
    change((prev) => prev.filter((f) => f.id !== id))
    setSelectedId((s) => (s === id ? null : s))
  }

  function check() {
    setResult(checkDiagram(scenario, forces))
    setStale(false)
  }

  function reset() {
    setForces([])
    setSelectedId(null)
    setResult(null)
    setStale(false)
    setShowAnswer(false)
  }

  const answerForces: PlacedForce[] = scenario.expected.map((e, i) => ({
    id: `answer-${i}`,
    type: e.type,
    angle: e.angle,
    length: e.answerLength,
    label: FORCE_INFO[e.type].label,
  }))

  return (
    <Container>
      <Link
        to="/tools/free-body"
        className="mb-6 inline-flex items-center gap-1.5 rounded text-sm font-medium text-muted hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <ArrowLeft size={16} aria-hidden="true" /> All scenarios
      </Link>

      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">Free-body diagram builder</p>
          <h1 className="text-2xl font-bold sm:text-3xl">{scenario.title}</h1>
          <p className="mt-2 text-muted">{scenario.description}</p>
        </div>
        <Card className="w-full max-w-[220px] shrink-0 p-3">
          <ScenarioScene id={scenario.id} title={`Sketch: ${scenario.title}`} />
        </Card>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="lg:col-start-1 lg:row-start-1">
          <Card className="mx-auto max-w-[560px] overflow-hidden p-0">
            <DiagramCanvas
              scenario={scenario}
              forces={forces}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onUpdate={updateForce}
              onRemove={removeForce}
              label={`Free-body diagram of ${scenario.object}. ${forces.length} force${forces.length === 1 ? '' : 's'} drawn.`}
            />
          </Card>
          <p className="mx-auto mt-3 max-w-[560px] text-sm text-muted">
            Drag an arrow (or its tip) to aim it. Directions snap to {ANGLE_STEP}°, and length is qualitative: longer
            means bigger. The <span className={scenario.motion.kind === 'velocity' ? 'text-velocity' : 'text-accel'}>
              {scenario.motion.kind === 'velocity' ? 'v' : 'a'}
            </span>{' '}
            marker shows the motion for reference; it is not a force. Keyboard: Tab to an arrow, ←/→ rotate, ↑/↓
            resize, Delete removes.
          </p>
        </div>

        <div className="flex flex-col gap-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <Palette onAdd={addForce} />
          <ForceList forces={forces} selectedId={selectedId} onSelect={setSelectedId} />
          {selected ? (
            <Inspector
              key={selected.id}
              force={selected}
              onUpdate={(patch) => updateForce(selected.id, patch)}
              onRemove={() => removeForce(selected.id)}
              onDone={() => setSelectedId(null)}
            />
          ) : (
            forces.length > 0 && (
              <p className="text-sm text-muted">Select a force to relabel it, set its angle or delete it.</p>
            )
          )}
        </div>

        <div className="flex flex-col gap-4 lg:col-start-1 lg:row-start-2">
          <div className="mx-auto flex w-full max-w-[560px] flex-wrap gap-2">
            <Button onClick={check}>
              <CheckCircle2 size={16} aria-hidden="true" /> Check my diagram
            </Button>
            {result && !result.allCorrect && (
              <Button variant="secondary" onClick={() => setShowAnswer((s) => !s)} aria-expanded={showAnswer}>
                {showAnswer ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                {showAnswer ? 'Hide answer' : 'Show answer'}
              </Button>
            )}
            <Button variant="ghost" onClick={reset} disabled={forces.length === 0 && !result}>
              <RotateCcw size={16} aria-hidden="true" /> Start over
            </Button>
          </div>

          <div aria-live="polite" className="mx-auto w-full max-w-[560px]">
            {result && <Feedback result={result} stale={stale} scenario={scenario} onSelect={setSelectedId} />}
          </div>

          {showAnswer && result && !result.allCorrect && (
            <Card className="mx-auto w-full max-w-[560px]">
              <h2 className="text-lg font-bold">Answer</h2>
              <p className="mt-1 text-sm text-muted">
                {scenario.expected.length} forces act on {scenario.object}:
              </p>
              <div className="mx-auto mt-3 max-w-[320px] overflow-hidden rounded-lg border border-border">
                <DiagramCanvas
                  scenario={scenario}
                  forces={answerForces}
                  readOnly
                  label={`Answer diagram for ${scenario.title}`}
                />
              </div>
              <ul className="mt-4 space-y-1.5 text-sm">
                {scenario.expected.map((e) => (
                  <li key={e.type}>
                    <span className="font-semibold text-force">
                      <RichText text={FORCE_INFO[e.type].label} />
                    </span>{' '}
                    {FORCE_INFO[e.type].name} from {e.source}, {e.answerDirection}.
                  </li>
                ))}
              </ul>
              <WhyNote scenario={scenario} />
            </Card>
          )}
        </div>
      </div>

      <section className="mt-12 border-t border-border pt-6">
        <h2 className="text-base font-bold">Try another scenario</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {SCENARIOS.filter((s) => s.id !== scenario.id).map((s) => (
            <Link
              key={s.id}
              to={`/tools/free-body?preset=${s.id}`}
              className="rounded-full border border-border px-3 py-1 text-sm text-muted hover:border-accent hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              {s.title}
            </Link>
          ))}
        </div>
      </section>
    </Container>
  )
}

function Palette({ onAdd }: { onAdd: (t: ForceType) => void }) {
  return (
    <Card className="p-4">
      <h2 className="text-base font-bold">Add a force</h2>
      <p className="mt-0.5 text-xs text-muted">New arrows start at the object’s center.</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {FORCE_ORDER.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onAdd(t)}
            aria-label={`Add ${FORCE_INFO[t].name.toLowerCase()}`}
            className="flex min-w-0 items-start gap-2 rounded-lg border border-border bg-surface px-2.5 py-2 text-left transition-colors hover:border-accent hover:bg-surface2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Plus size={16} className="mt-0.5 shrink-0 text-force" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-sm font-semibold leading-tight">{FORCE_INFO[t].name}</span>
              <span className="block text-xs leading-tight text-muted">{FORCE_INFO[t].blurb}</span>
            </span>
          </button>
        ))}
      </div>
    </Card>
  )
}

function ForceList({
  forces,
  selectedId,
  onSelect,
}: {
  forces: PlacedForce[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  if (forces.length === 0) return null
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold">Your forces ({forces.length})</h2>
      <ul className="flex flex-wrap gap-2">
        {forces.map((f) => (
          <li key={f.id}>
            <button
              type="button"
              onClick={() => onSelect(f.id)}
              aria-pressed={f.id === selectedId}
              className={cx(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent',
                f.id === selectedId ? 'border-accent bg-surface2 text-text' : 'border-border text-muted hover:text-text',
              )}
            >
              <span className="font-mono font-semibold text-force">
                <RichText text={f.label || '?'} />
              </span>
              <span className="text-xs">{f.angle}°</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Inspector({
  force,
  onUpdate,
  onRemove,
  onDone,
}: {
  force: PlacedForce
  onUpdate: (patch: Partial<PlacedForce>) => void
  onRemove: () => void
  onDone: () => void
}) {
  const uid = useId()
  const [angleDraft, setAngleDraft] = useState(String(force.angle))
  useEffect(() => {
    setAngleDraft(String(force.angle))
  }, [force.angle])

  function commitAngle() {
    const v = Number(angleDraft)
    if (angleDraft.trim() === '' || !Number.isFinite(v)) setAngleDraft(String(force.angle))
    else {
      const a = snapAngle(v)
      onUpdate({ angle: a })
      setAngleDraft(String(a))
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold">{FORCE_INFO[force.type].name}</h2>
        <Button variant="ghost" className="px-2 py-1 text-xs" onClick={onDone}>
          Done
        </Button>
      </div>

      <label htmlFor={`${uid}-label`} className="mt-3 block text-sm font-medium">
        Label
      </label>
      <input
        id={`${uid}-label`}
        value={force.label}
        maxLength={24}
        onChange={(e) => onUpdate({ label: e.target.value })}
        className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 font-mono text-sm focus:border-accent focus:outline-none"
        aria-describedby={`${uid}-label-help`}
      />
      <p id={`${uid}-label-help`} className="mt-1 text-xs text-muted">
        Use _ for a subscript: F_N shows as F<sub>N</sub>.
      </p>

      <label htmlFor={`${uid}-angle`} className="mt-4 block text-sm font-medium">
        Direction (degrees counterclockwise from +x)
      </label>
      <div className="mt-1 flex items-center gap-2">
        <button
          type="button"
          aria-label={`Rotate counterclockwise ${ANGLE_STEP} degrees`}
          onClick={() => onUpdate({ angle: normalizeAngle(force.angle + ANGLE_STEP) })}
          className="rounded-lg border border-border p-2 text-muted hover:bg-surface2 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <RotateCcw size={16} aria-hidden="true" />
        </button>
        <input
          id={`${uid}-angle`}
          type="number"
          inputMode="numeric"
          step={ANGLE_STEP}
          value={angleDraft}
          onChange={(e) => setAngleDraft(e.target.value)}
          onBlur={commitAngle}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitAngle()
          }}
          className="w-20 min-w-0 rounded-lg border border-border bg-bg px-2 py-2 text-center font-mono text-sm focus:border-accent focus:outline-none"
        />
        <button
          type="button"
          aria-label={`Rotate clockwise ${ANGLE_STEP} degrees`}
          onClick={() => onUpdate({ angle: normalizeAngle(force.angle - ANGLE_STEP) })}
          className="rounded-lg border border-border p-2 text-muted hover:bg-surface2 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <RotateCw size={16} aria-hidden="true" />
        </button>
        <span className="text-sm text-muted">{directionWord(force.angle)}</span>
      </div>

      <label htmlFor={`${uid}-len`} className="mt-4 block text-sm font-medium">
        Relative size: <span className="font-normal text-muted">{lengthWord(force.length)}</span>
      </label>
      <input
        id={`${uid}-len`}
        type="range"
        min={LENGTH_MIN}
        max={LENGTH_MAX}
        step={5}
        value={force.length}
        onChange={(e) => onUpdate({ length: Number(e.target.value) })}
        className="mt-2 w-full accent-accent"
      />

      <Button variant="secondary" className="mt-4 w-full text-bad" onClick={onRemove}>
        <Trash2 size={16} aria-hidden="true" /> Delete this force
      </Button>
    </Card>
  )
}

const KIND_ICON: Record<FeedbackKind, { icon: ReactNode; tone: string }> = {
  correct: { icon: <CheckCircle2 size={18} aria-hidden="true" />, tone: 'text-good' },
  missing: { icon: <AlertCircle size={18} aria-hidden="true" />, tone: 'text-bad' },
  kind: { icon: <Tag size={18} aria-hidden="true" />, tone: 'text-bad' },
  direction: { icon: <Compass size={18} aria-hidden="true" />, tone: 'text-bad' },
  extra: { icon: <XCircle size={18} aria-hidden="true" />, tone: 'text-bad' },
  label: { icon: <Tag size={18} aria-hidden="true" />, tone: 'text-accent' },
  size: { icon: <Ruler size={18} aria-hidden="true" />, tone: 'text-accent' },
}

function Feedback({
  result,
  stale,
  scenario,
  onSelect,
}: {
  result: CheckResult
  stale: boolean
  scenario: Scenario
  onSelect: (id: string) => void
}) {
  return (
    <Card className={cx(result.allCorrect && 'border-good/50')}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-bold">{result.allCorrect ? 'Correct diagram' : 'Feedback'}</h2>
        {result.allCorrect ? (
          <Badge tone="good">All {result.expectedCount} forces right</Badge>
        ) : (
          <Badge tone="neutral">
            {result.correctCount} of {result.expectedCount} forces right
          </Badge>
        )}
      </div>
      {stale && (
        <p className="mt-2 text-sm text-muted">You’ve changed the diagram since this check. Check again to update.</p>
      )}
      {result.allCorrect ? (
        <WhyNote scenario={scenario} />
      ) : (
        <ul className="mt-3 space-y-3">
          {result.items.map((item, i) => (
            <li key={i} className="flex gap-2.5 text-sm">
              <span className={cx('mt-0.5 shrink-0', KIND_ICON[item.kind].tone)}>{KIND_ICON[item.kind].icon}</span>
              <span className="min-w-0">
                <RichText text={item.text} />
                {item.forceId && item.kind !== 'correct' && (
                  <>
                    {' '}
                    <button
                      type="button"
                      onClick={() => onSelect(item.forceId!)}
                      className="font-medium text-accent underline underline-offset-2 hover:no-underline"
                    >
                      Select it
                    </button>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function WhyNote({ scenario }: { scenario: Scenario }) {
  return (
    <div className="mt-4 rounded-lg bg-surface2 p-4">
      <h3 className="flex items-center gap-2 font-sans text-sm font-bold">
        <Lightbulb size={16} className="text-accent" aria-hidden="true" /> Why
      </h3>
      <div className="mt-2 space-y-2 text-sm">
        {scenario.why.map((p, i) => (
          <p key={i}>
            <RichText text={p} />
          </p>
        ))}
      </div>
    </div>
  )
}
