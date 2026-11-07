import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, Lock, Sparkles } from 'lucide-react'
import { getProblem, problems } from '@/content/problems'
import { UNIT_LABELS, UNIT_ORDER, type Problem, type SimulatorLink } from '@/types/problem'
import { ButtonLink, Card, Container, cx } from '@/components/ui'
import { DifficultyBadge, ProBadge, TagList } from './practice-ui'
import { PartCard } from './PartCard'
import { isProblemSolved, useSolvedParts } from './progress'

const SITE = 'eengineer Physics'

export function ProblemPage() {
  const { problemId = '' } = useParams()
  const problem = getProblem(problemId)

  useEffect(() => {
    document.title = problem ? `${problem.title} · ${SITE}` : `Problem not found · ${SITE}`
  }, [problem])

  if (!problem) return <ProblemNotFound />

  const locked = !problem.free
  return (
    <Container className="max-w-3xl">
      <Breadcrumb problem={problem} />
      <ProblemHeader problem={problem} />

      {locked ? (
        <LockedView problem={problem} />
      ) : (
        <>
          <Card className="mb-6">
            <h2 className="sr-only">Problem statement</h2>
            <p className="whitespace-pre-line break-words leading-relaxed">{problem.statement}</p>
            {problem.simulator && <SimulatorButton link={problem.simulator} />}
          </Card>
          <div className="space-y-6">
            {/* Keyed by problem so all part state resets when navigating to another problem. */}
            {problem.parts.map((part) => (
              <PartCard key={`${problem.id}:${part.id}`} problem={problem} part={part} />
            ))}
          </div>
        </>
      )}

      <UnitNav problem={problem} />
    </Container>
  )
}

function ProblemNotFound() {
  return (
    <Container className="max-w-3xl">
      <Card className="text-center">
        <h1 className="text-2xl font-bold">Problem not found</h1>
        <p className="mx-auto mt-2 max-w-md text-muted">
          We could not find that problem. It may have been renamed or moved. Pick another one from the list.
        </p>
        <ButtonLink to="/practice" className="mt-5">
          <ArrowLeft size={16} aria-hidden="true" /> Back to practice
        </ButtonLink>
      </Card>
    </Container>
  )
}

function Breadcrumb({ problem }: { problem: Problem }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm">
      <ol className="flex flex-wrap items-center gap-1 text-muted">
        <li>
          <Link to="/practice" className="hover:text-text hover:underline">
            Practice
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link to={`/practice?unit=${problem.unit}`} className="hover:text-text hover:underline">
            {UNIT_LABELS[problem.unit]}
          </Link>
        </li>
      </ol>
    </nav>
  )
}

function ProblemHeader({ problem }: { problem: Problem }) {
  const solved = useSolvedParts()
  const done = problem.free && isProblemSolved(problem, solved)
  return (
    <header className="mb-6">
      <p className="mb-2 font-mono text-xs font-medium uppercase tracking-widest text-accent">
        Unit {UNIT_ORDER.indexOf(problem.unit) + 1} · {problem.id}
      </p>
      <h1 className="break-words text-2xl font-bold sm:text-3xl">{problem.title}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <DifficultyBadge difficulty={problem.difficulty} />
        {!problem.free && <ProBadge />}
        {done && (
          <span className="inline-flex items-center rounded-full border border-good/40 px-2 py-0.5 text-xs font-medium text-good">
            All parts solved
          </span>
        )}
      </div>
      {problem.tags.length > 0 && (
        <div className="mt-3">
          <TagList tags={problem.tags} />
        </div>
      )}
    </header>
  )
}

function teaser(text: string, max = 220) {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

function LockedView({ problem }: { problem: Problem }) {
  return (
    <>
      <div className="relative mb-6 overflow-hidden rounded-lg border border-border bg-surface p-5">
        <h2 className="sr-only">Problem statement preview</h2>
        <p className="whitespace-pre-line break-words leading-relaxed text-muted">{teaser(problem.statement)}</p>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-surface/0 to-surface"
        />
      </div>
      <Card className="border-accent/40 bg-accent/5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Lock size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-bold">This problem is part of Pro</h2>
            <p className="mt-1 text-muted">
              {problem.parts.length > 0 ? `${problem.parts.length}-part problem with` : 'Includes'} answer checking, hints,
              full worked solutions and unlimited AI tutoring. Pro also unlocks the full problem bank and timed mock
              exams.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ButtonLink to="/pro">
                <Sparkles size={16} aria-hidden="true" /> See Pro
              </ButtonLink>
              <ButtonLink to="/practice?access=free" variant="secondary">
                Browse free problems
              </ButtonLink>
            </div>
          </div>
        </div>
      </Card>
    </>
  )
}

function SimulatorButton({ link }: { link: SimulatorLink }) {
  const to =
    link.tool === 'fbd'
      ? `/tools/free-body?preset=${encodeURIComponent(link.preset)}`
      : `/tools/motion?preset=${encodeURIComponent(link.preset)}`
  const label = link.tool === 'fbd' ? 'Open in the free-body diagram builder' : 'Open in the motion simulator'
  return (
    <div className="mt-4 border-t border-border pt-4">
      <ButtonLink to={to} variant="secondary">
        <ExternalLink size={16} aria-hidden="true" /> {label}
      </ButtonLink>
    </div>
  )
}

function UnitNav({ problem }: { problem: Problem }) {
  const inUnit = problems.filter((p) => p.unit === problem.unit)
  const i = inUnit.findIndex((p) => p.id === problem.id)
  const prev = i > 0 ? inUnit[i - 1] : undefined
  const next = i >= 0 && i < inUnit.length - 1 ? inUnit[i + 1] : undefined

  return (
    <nav aria-label="Problems in this unit" className="mt-10 border-t border-border pt-6">
      <p className="mb-3 text-center text-sm text-muted">
        Problem {i + 1} of {inUnit.length} in {UNIT_LABELS[problem.unit]}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <NavCard problem={prev} dir="prev" />
        <NavCard problem={next} dir="next" />
      </div>
    </nav>
  )
}

function NavCard({ problem, dir }: { problem?: Problem; dir: 'prev' | 'next' }) {
  if (!problem) return <div aria-hidden="true" />
  const Icon = dir === 'prev' ? ChevronLeft : ChevronRight
  return (
    <Link
      to={`/practice/${problem.id}`}
      className={cx(
        'flex min-w-0 items-center gap-2 rounded-lg border border-border bg-surface p-3 transition-colors hover:bg-surface2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent',
        dir === 'next' && 'col-start-2 flex-row-reverse text-right',
      )}
    >
      <Icon size={18} className="shrink-0 text-muted" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block text-xs text-muted">{dir === 'prev' ? 'Previous' : 'Next'}</span>
        <span className={cx('flex items-center gap-1 font-semibold', dir === 'next' && 'justify-end')}>
          {!problem.free && <Lock size={12} className="shrink-0 text-muted" aria-label="Pro" />}
          <span className="truncate">{problem.title}</span>
        </span>
      </span>
    </Link>
  )
}
