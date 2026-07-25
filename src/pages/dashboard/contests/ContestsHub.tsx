import * as React from 'react'
import { Link } from 'react-router-dom'
import { Trophy, Users } from 'lucide-react'
import * as contestsApi from '@/lib/api/contests'
import type { Contest } from '@/lib/api/contests'
import { Card } from '@/components/ui/card'
import { Chip } from '@/components/ui/chip'
import { errorMessage } from '@/lib/utils'

function formatDeadline(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ContestCard({ contest }: { contest: Contest }) {
  return (
    <Link to={`/dashboard/contests/${contest.id}`}>
      <Card theme="dashboard" className="p-4 hover:bg-white/[0.03] transition-colors duration-150">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-sans text-[0.9375rem] font-semibold text-dark-text leading-snug">{contest.title}</h3>
          {contest.discipline ? (
            <Chip theme="dashboard" discipline={contest.discipline} className="flex-shrink-0">
              {contest.discipline}
            </Chip>
          ) : (
            <Chip theme="dashboard" className="flex-shrink-0">All disciplines</Chip>
          )}
        </div>
        <p className="font-sans text-[0.8125rem] text-dark-muted leading-snug mb-3 line-clamp-2">
          {contest.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-dark-muted">
            <Users size={12} strokeWidth={1.8} />
            <span className="font-sans text-[13px]">{contest.submissionCount} entries</span>
          </div>
          <span className="font-sans text-[12px] text-dark-muted">
            {contest.phase === 'submitting'
              ? `Submit by ${formatDeadline(contest.submissionDeadline)}`
              : contest.phase === 'voting'
                ? 'Voting open'
                : 'Completed'}
          </span>
        </div>
        {contest.mySubmission && (
          <div className="mt-3 pt-3 border-t border-white/8 font-sans text-[12px] text-emerald-400">
            You entered this one
          </div>
        )}
      </Card>
    </Link>
  )
}

export function ContestsHub() {
  const [contests, setContests] = React.useState<Contest[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    contestsApi
      .fetchContests()
      .then(setContests)
      .catch((err) => setError(errorMessage(err, 'Failed to load contests.')))
  }, [])

  return (
    <div className="flex-1 w-full px-8 py-8 max-w-[900px] mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <Trophy size={18} strokeWidth={1.8} className="text-gold-dark" />
        <h1 className="font-display text-xl font-semibold text-dark-text">Contests</h1>
      </div>
      <p className="font-sans text-[0.8125rem] text-dark-muted mb-6 max-w-[560px]">
        Build something against a deadline. When it closes, entries go head-to-head with no names attached —
        so what gets ranked is the work, not who posted it.
      </p>

      {error && <p className="font-sans text-[0.8125rem] text-red-400">{error}</p>}

      {!error && !contests && <p className="font-sans text-[0.8125rem] text-dark-muted">Loading…</p>}

      {contests && contests.length === 0 && (
        <p className="font-sans text-[0.8125rem] text-dark-muted">
          Nothing running right now. The next contest gets announced here before anywhere else.
        </p>
      )}

      {contests && contests.length > 0 && (
        <div className="flex flex-col gap-3">
          {contests.map((c) => (
            <ContestCard key={c.id} contest={c} />
          ))}
        </div>
      )}
    </div>
  )
}
