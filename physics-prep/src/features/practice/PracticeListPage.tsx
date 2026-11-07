import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronRight, Circle, CircleCheck, Lock, RotateCcw } from 'lucide-react'
import { problems } from '@/content/problems'
import { UNIT_LABELS, UNIT_ORDER, type Difficulty, type Problem, type Unit } from '@/types/problem'
import { Button, ButtonLink, Card, Container, PageHeader, cx } from '@/components/ui'
import { DIFFICULTY_LABELS, DIFFICULTY_ORDER, DifficultyBadge, ProBadge, TagList } from './practice-ui'
import { isProblemSolved, solvedPartCount, useSolvedParts } from './progress'

type Access = 'free' | 'pro'

// Filters live in the URL so a filtered view can be bookmarked and survives Back.
function readFilters(params: URLSearchParams) {
  const unit = params.get('unit')
  const difficulty = params.get('difficulty')
  const access = params.get('access')
  return {
    unit: UNIT_ORDER.includes(unit as Unit) ? (unit as Unit) : null,
    difficulty: DIFFICULTY_ORDER.includes(difficulty as Difficulty) ? (difficulty as Difficulty) : null,
    access: access === 'free' || access === 'pro' ? (access as Access) : null,
  }
}

export function PracticeListPage() {
  const [params, setParams] = useSearchParams()
  const filters = readFilters(params)
  const solved = useSolvedParts()

  useEffect(() => {
    document.title = 'Practice problems · eengineer Physics'
  }, [])

  const setFilter = (key: 'unit' | 'difficulty' | 'access', value: string | null) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )
  }

  const resetFilters = () => setParams({}, { replace: true })
  const anyFilter = Boolean(filters.unit || filters.difficulty || filters.access)

  const visible = useMemo(
    () =>
      problems.filter(
        (p) =>
          (!filters.unit || p.unit === filters.unit) &&
          (!filters.difficulty || p.difficulty === filters.difficulty) &&
          (!filters.access || (filters.access === 'free' ? p.free : !p.free)),
      ),
    [filters.unit, filters.difficulty, filters.access],
  )

  const freeTotal = problems.filter((p) => p.free).length
  const freeSolved = problems.filter((p) => p.free && isProblemSolved(p, solved)).length
  const units = filters.unit ? [filters.unit] : UNIT_ORDER

  return (
    <Container>
      <PageHeader eyebrow="AP Physics C: Mechanics" title="Practice problems">
        Original multi-part problems in the style of the free-response section. Check each part, open a hint when
        you are stuck, and read the full worked solution.
      </PageHeader>

      {problems.length === 0 ? (
        <Card className="text-center">
          <h2 className="text-xl font-bold">Problems are on the way</h2>
          <p className="mx-auto mt-2 max-w-md text-muted">
            The first set of practice problems is being written. Meanwhile, try the free interactive tools.
          </p>
          <ButtonLink to="/tools" className="mt-5">
            Explore the tools
          </ButtonLink>
        </Card>
      ) : (
        <>
          <Filters filters={filters} setFilter={setFilter} anyFilter={anyFilter} onReset={resetFilters} />

          {freeTotal > 0 && (
            <ProgressSummary solved={freeSolved} total={freeTotal} />
          )}

          {visible.length === 0 ? (
            <Card className="text-center">
              <p className="font-semibold">No problems match these filters.</p>
              <Button variant="secondary" className="mt-4" onClick={resetFilters}>
                <RotateCcw size={16} aria-hidden="true" /> Reset filters
              </Button>
            </Card>
          ) : (
            <div className="space-y-10">
              {units.map((unit) => {
                const all = problems.filter((p) => p.unit === unit)
                const shown = visible.filter((p) => p.unit === unit)
                if (shown.length === 0 && anyFilter) return null
                return <UnitSection key={unit} unit={unit} all={all} shown={shown} solved={solved} />
              })}
            </div>
          )}
        </>
      )}
    </Container>
  )
}

type FilterState = ReturnType<typeof readFilters>

function Filters({
  filters,
  setFilter,
  anyFilter,
  onReset,
}: {
  filters: FilterState
  setFilter: (key: 'unit' | 'difficulty' | 'access', value: string | null) => void
  anyFilter: boolean
  onReset: () => void
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 lg:flex-row lg:flex-wrap lg:items-end">
      <div className="flex min-w-0 flex-col gap-1.5 lg:w-72">
        <label htmlFor="unit-filter" className="text-xs font-semibold uppercase tracking-wider text-muted">
          Unit
        </label>
        <select
          id="unit-filter"
          value={filters.unit ?? ''}
          onChange={(e) => setFilter('unit', e.target.value || null)}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <option value="">All units</option>
          {UNIT_ORDER.map((u, i) => (
            <option key={u} value={u}>
              {i + 1}. {UNIT_LABELS[u]}
            </option>
          ))}
        </select>
      </div>

      <Segmented
        label="Difficulty"
        value={filters.difficulty}
        options={DIFFICULTY_ORDER.map((d) => ({ value: d, label: DIFFICULTY_LABELS[d] }))}
        onChange={(v) => setFilter('difficulty', v)}
      />

      <Segmented
        label="Access"
        value={filters.access}
        options={[
          { value: 'free', label: 'Free' },
          { value: 'pro', label: 'Pro' },
        ]}
        onChange={(v) => setFilter('access', v)}
      />

      {anyFilter && (
        <Button
          variant="ghost"
          className="self-start lg:ml-auto"
          onClick={onReset}
        >
          <RotateCcw size={16} aria-hidden="true" /> Reset
        </Button>
      )}
    </div>
  )
}

/** A row of toggle buttons with an implicit "All" option. */
function Segmented({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string | null
  options: { value: string; label: string }[]
  onChange: (value: string | null) => void
}) {
  const all = [{ value: '', label: 'All' }, ...options]
  return (
    <div className="flex min-w-0 flex-col gap-1.5" role="group" aria-labelledby={`seg-${label}`}>
      <span id={`seg-${label}`} className="text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-bg p-1">
        {all.map((o) => {
          const active = (value ?? '') === o.value
          return (
            <button
              key={o.value || 'all'}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.value || null)}
              className={cx(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent',
                active ? 'bg-accent text-accent-ink' : 'text-muted hover:bg-surface2 hover:text-text',
              )}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ProgressSummary({ solved, total }: { solved: number; total: number }) {
  const pct = total ? Math.round((solved / total) * 100) : 0
  return (
    <div className="mb-8">
      <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold">Your progress</span>
        <span className="text-muted">
          {solved} of {total} free problems solved
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-surface2"
        role="progressbar"
        aria-label="Free problems solved"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={solved}
      >
        <div className="h-full rounded-full bg-good transition-[width]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function UnitSection({
  unit,
  all,
  shown,
  solved,
}: {
  unit: Unit
  all: Problem[]
  shown: Problem[]
  solved: ReadonlySet<string>
}) {
  const unitNumber = UNIT_ORDER.indexOf(unit) + 1
  const solvable = all.filter((p) => p.free)
  const solvedCount = solvable.filter((p) => isProblemSolved(p, solved)).length
  const proCount = all.length - solvable.length
  const headingId = `unit-${unit}`

  return (
    <section aria-labelledby={headingId}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <h2 id={headingId} className="text-xl font-bold">
          <span className="mr-2 font-mono text-sm font-medium text-accent">Unit {unitNumber}</span>
          {UNIT_LABELS[unit]}
        </h2>
        {all.length > 0 && (
          <p className="text-sm text-muted">
            {solvedCount} of {solvable.length} solved
            {proCount > 0 && <span> · {proCount} more with Pro</span>}
          </p>
        )}
      </div>

      {all.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-5 text-sm text-muted">
          Problems for this unit are coming soon.
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
          {shown.map((p) => (
            <ProblemRow key={p.id} problem={p} solved={solved} />
          ))}
        </ul>
      )}
    </section>
  )
}

function ProblemRow({ problem, solved }: { problem: Problem; solved: ReadonlySet<string> }) {
  const locked = !problem.free
  const done = !locked && isProblemSolved(problem, solved)
  const partsDone = locked ? 0 : solvedPartCount(problem, solved)
  const status = locked ? 'Pro, locked' : done ? 'Solved' : partsDone > 0 ? 'In progress' : 'Not solved'

  return (
    <li>
      <Link
        to={`/practice/${problem.id}`}
        className="group flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-surface2 focus-visible:bg-surface2 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
      >
        <span className="mt-0.5 shrink-0" title={status}>
          {locked ? (
            <Lock size={18} className="text-muted" aria-hidden="true" />
          ) : done ? (
            <CircleCheck size={18} className="text-good" aria-hidden="true" />
          ) : (
            <Circle size={18} className={partsDone > 0 ? 'text-good/60' : 'text-border'} aria-hidden="true" />
          )}
          <span className="sr-only">{status}: </span>
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={cx('break-words font-semibold', locked && 'text-muted')}>{problem.title}</span>
            {locked && <ProBadge />}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <DifficultyBadge difficulty={problem.difficulty} />
            {!locked && problem.parts.length > 1 && (
              <span className="text-xs text-muted">
                {partsDone > 0 ? `${partsDone}/${problem.parts.length} parts` : `${problem.parts.length} parts`}
              </span>
            )}
          </div>
          {problem.tags.length > 0 && (
            <div className="mt-2">
              <TagList tags={problem.tags} />
            </div>
          )}
        </div>

        <ChevronRight
          size={18}
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
        />
      </Link>
    </li>
  )
}
