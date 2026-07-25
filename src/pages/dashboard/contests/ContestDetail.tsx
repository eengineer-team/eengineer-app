import * as React from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { ArrowLeft, Trophy, Check } from 'lucide-react'
import * as contestsApi from '@/lib/api/contests'
import type { Contest, ContestSubmission } from '@/lib/api/contests'
import { useAuth } from '@/lib/auth-context'
import { Card } from '@/components/ui/card'
import { Chip } from '@/components/ui/chip'
import { Button } from '@/components/ui/button'
import { LabelCaps } from '@/components/ui/label-caps'
import { cn, errorMessage } from '@/lib/utils'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// Submission form -- only rendered during the 'submitting' phase. A simple
// write-up + optional link/image URL, not a file upload pipeline (v1).
function SubmitSection({ contest, onSubmitted }: { contest: Contest; onSubmitted: () => void }) {
  const [content, setContent] = React.useState('')
  const [imageUrl, setImageUrl] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  if (contest.mySubmission) {
    return (
      <Card theme="dashboard" className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Check size={14} strokeWidth={2.2} className="text-emerald-400" />
          <span className="font-sans text-[0.8125rem] font-medium text-dark-text">Entry submitted</span>
        </div>
        <p className="font-sans text-[0.8125rem] text-dark-muted whitespace-pre-wrap">{contest.mySubmission.content}</p>
        {contest.mySubmission.imageUrl && (
          <a
            href={contest.mySubmission.imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 font-sans text-[13px] text-gold-dark hover:brightness-110"
          >
            View attachment →
          </a>
        )}
      </Card>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) return
    setSubmitting(true)
    setError(null)
    try {
      const uid = await contestsApi.currentUid()
      if (!uid) throw new Error('Sign in to submit an entry.')
      await contestsApi.submitEntry(contest.id, uid, trimmed, imageUrl)
      onSubmitted()
    } catch (err) {
      setError(errorMessage(err, "Couldn't submit — try again in a moment."))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card theme="dashboard" className="p-4">
      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
        <div>
          <LabelCaps className="block mb-1.5">Your entry</LabelCaps>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2.5 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25 resize-none"
            placeholder="Describe what you built/designed and why — this is what other Builders will vote on."
          />
        </div>
        <div>
          <LabelCaps className="block mb-1.5">Link (optional)</LabelCaps>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2.5 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25"
            placeholder="Drive / GitHub / photo link"
          />
        </div>
        {error && <p className="font-sans text-[0.8125rem] text-red-400" role="alert">{error}</p>}
        <Button type="submit" variant="accent" size="sm" disabled={!content.trim() || submitting} className="self-end">
          {submitting ? 'Submitting…' : 'Submit entry'}
        </Button>
      </form>
    </Card>
  )
}

// Blind pairwise voting -- content/imageUrl only, never the author's name,
// so votes reflect the work and not who made it.
type VotePool = { pair: [ContestSubmission, ContestSubmission] | null; exhausted: boolean }

// Minimum time the picked/receding state stays on screen. Without it the
// whole thing resolves in whatever the round-trip takes -- on a fast
// connection that's ~80ms, which reads as the pair blinking rather than as
// a choice being registered.
const PICK_HOLD_MS = 240

function VoteSection({ contest }: { contest: Contest }) {
  const [pair, setPair] = React.useState<[ContestSubmission, ContestSubmission] | null>(null)
  // Separate from `voting`: only the very first fetch may replace the whole
  // section with a loading line. Every later one keeps the current pair on
  // screen until the next is ready, so the section never collapses to text
  // mid-interaction.
  const [firstLoad, setFirstLoad] = React.useState(true)
  const [voting, setVoting] = React.useState(false)
  const [picked, setPicked] = React.useState<string | null>(null)
  // Bumped per resolved vote and used as the grid's key, so the incoming
  // pair remounts and re-runs its entry animation.
  const [round, setRound] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)
  const [exhausted, setExhausted] = React.useState(false)

  // Returns the next pool rather than writing state, so the caller decides
  // WHEN to commit it. Committing inside here is what would let a fast
  // network swap the cards out from under the pick animation.
  const computePool = React.useCallback(async (): Promise<VotePool> => {
    const uid = await contestsApi.currentUid()
    if (!uid) throw new Error('Sign in to vote.')
    const { candidates, votedPairs } = await contestsApi.fetchVotingPool(contest.id, uid)
    const unseen: [ContestSubmission, ContestSubmission][] = []
    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        const key = [candidates[i].id, candidates[j].id].sort().join('|')
        if (!votedPairs.has(key)) unseen.push([candidates[i], candidates[j]])
      }
    }
    if (unseen.length === 0) return { pair: null, exhausted: true }
    return { pair: unseen[Math.floor(Math.random() * unseen.length)], exhausted: false }
  }, [contest.id])

  React.useEffect(() => {
    let cancelled = false
    computePool()
      .then((pool) => {
        if (cancelled) return
        setPair(pool.pair)
        setExhausted(pool.exhausted)
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, 'Failed to load entries to compare.'))
      })
      .finally(() => {
        if (!cancelled) setFirstLoad(false)
      })
    return () => { cancelled = true }
  }, [computePool])

  async function handleVote(winnerId: string) {
    if (!pair || voting) return
    setVoting(true)
    setPicked(winnerId)
    setError(null)
    try {
      const uid = await contestsApi.currentUid()
      if (!uid) throw new Error('Sign in to vote.')
      // Vote and prefetch the next pair, but don't commit until the hold has
      // also elapsed -- both settle before anything on screen changes.
      const [pool] = await Promise.all([
        contestsApi
          .castVote(contest.id, uid, pair[0].id, pair[1].id, winnerId)
          .then(() => computePool()),
        new Promise((resolve) => setTimeout(resolve, PICK_HOLD_MS)),
      ])
      setPair(pool.pair)
      setExhausted(pool.exhausted)
      setRound((r) => r + 1)
    } catch (err) {
      setError(errorMessage(err, "Couldn't record that vote."))
    } finally {
      setVoting(false)
      setPicked(null)
    }
  }

  if (firstLoad) return <p className="font-sans text-[0.8125rem] text-dark-muted">Loading entries…</p>
  // Only surrender the whole section when there's nothing to fall back to.
  // A failed vote used to replace the pair with an error line, so a dropped
  // request cost you the comparison you were in the middle of reading.
  if (error && !pair) return <p className="font-sans text-[0.8125rem] text-red-400">{error}</p>
  if (exhausted || !pair) {
    return (
      <p className="font-sans text-[0.8125rem] text-dark-muted">
        {contest.submissionCount < 2
          ? 'Voting needs at least two entries to compare. Only one came in for this one.'
          : "You've been through every pairing. Nothing left to rank until more entries land."}
      </p>
    )
  }

  return (
    <div>
      <p className="font-sans text-[0.75rem] text-dark-muted mb-3">
        Two entries, no names. Pick the one you'd rather have built.
      </p>
      {error && (
        <p className="font-sans text-[0.8125rem] text-red-400 mb-3 animate-pop-in motion-reduce:animate-none" role="alert">
          {error} Your pick wasn't recorded — try again.
        </p>
      )}
      <div key={round} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {pair.map((s, i) => {
          const isPicked = picked === s.id
          const isRejected = voting && !isPicked
          return (
            // Entry animation lives on the wrapper and the interaction
            // transition on the button, so the two never drive transform/
            // opacity at the same time and fight each other.
            <div
              key={s.id}
              style={{ animationDelay: `${i * 60}ms` }}
              className="opacity-0 animate-bubble-in motion-reduce:animate-none motion-reduce:opacity-100"
            >
              <button
                type="button"
                disabled={voting}
                onClick={() => void handleVote(s.id)}
                className={cn(
                  'w-full h-full text-left border rounded-lg p-4',
                  'transition-[transform,opacity,border-color,background-color] duration-200 ease-out',
                  'motion-reduce:transition-none',
                  isPicked
                    ? 'scale-[1.02] border-gold-dark/70 bg-gold-dark/[0.07]'
                    : isRejected
                      ? 'scale-[0.97] opacity-35 border-white/10'
                      : 'border-white/10 hover:border-gold-dark/50 hover:bg-white/[0.03]',
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <LabelCaps>Entry {i === 0 ? 'A' : 'B'}</LabelCaps>
                  {isPicked && (
                    <span className="flex items-center gap-1 font-sans text-[11px] font-semibold text-gold-dark animate-pop-in motion-reduce:animate-none">
                      <Check size={11} strokeWidth={2.6} />
                      Picked
                    </span>
                  )}
                </div>
                <p className="font-sans text-[0.8125rem] text-dark-text whitespace-pre-wrap line-clamp-6">{s.content}</p>
                {s.imageUrl && (
                  <span className="inline-block mt-2 font-sans text-[12px] text-gold-dark">has attachment</span>
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LeaderboardSection({ contestId }: { contestId: string }) {
  const [rows, setRows] = React.useState<ContestSubmission[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    contestsApi
      .fetchLeaderboard(contestId)
      .then(setRows)
      .catch((err) => setError(errorMessage(err, 'Failed to load the leaderboard.')))
  }, [contestId])

  if (error) return <p className="font-sans text-[0.8125rem] text-red-400">{error}</p>
  if (!rows) return <p className="font-sans text-[0.8125rem] text-dark-muted">Loading…</p>
  if (rows.length === 0) {
    // Not a generic "nothing here" — before the deadline this is the blind-
    // submission rule doing its job, and saying so is more useful than
    // implying the contest is dead.
    return (
      <p className="font-sans text-[0.8125rem] text-dark-muted">
        Entries stay hidden until the submission deadline passes.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((s, i) => (
        <div key={s.id} className="flex items-center gap-3 border border-white/8 rounded-lg px-3.5 py-2.5">
          <span className="font-sans text-[0.8125rem] font-semibold text-dark-muted w-5 flex-shrink-0">{i + 1}</span>
          <p className="flex-1 min-w-0 font-sans text-[0.8125rem] text-dark-text truncate">{s.content}</p>
          <span className="font-sans text-[13px] text-gold-dark flex-shrink-0">{s.eloRating}</span>
          <span className="font-sans text-[12px] text-dark-muted flex-shrink-0">{s.wins}W–{s.losses}L</span>
        </div>
      ))}
    </div>
  )
}

export function ContestDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [contest, setContest] = React.useState<Contest | null | undefined>(undefined)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(() => {
    contestsApi
      .fetchContests()
      .then((all) => setContest(all.find((c) => c.id === id) ?? null))
      .catch((err) => setError(errorMessage(err, 'Failed to load this contest.')))
  }, [id])

  React.useEffect(() => {
    load()
  }, [load])

  if (error) return <p className="font-sans text-[0.8125rem] text-red-400 px-8 py-8">{error}</p>
  if (contest === undefined) return null
  if (contest === null) return <Navigate to="/dashboard/contests" replace />

  return (
    <div className="flex-1 w-full px-8 py-8 max-w-[720px] mx-auto">
      <Link
        to="/dashboard/contests"
        className="inline-flex items-center gap-1.5 font-sans text-[0.8125rem] text-dark-muted hover:text-white/85 transition-colors mb-6"
      >
        <ArrowLeft size={13} strokeWidth={2} />
        Contests
      </Link>

      <div className="flex items-start justify-between gap-4 mb-3">
        <h1 className="font-display text-[1.375rem] font-bold text-dark-text leading-tight">{contest.title}</h1>
        {contest.discipline ? (
          <Chip theme="dashboard" discipline={contest.discipline} className="flex-shrink-0">
            {contest.discipline}
          </Chip>
        ) : (
          <Chip theme="dashboard" className="flex-shrink-0">All disciplines</Chip>
        )}
      </div>

      <p className="font-sans text-[0.875rem] leading-[1.6] text-white/75 mb-4">{contest.description}</p>

      <div className="flex items-center gap-4 mb-8 font-sans text-[12px] text-dark-muted">
        <span>Submissions {contest.phase === 'submitting' ? 'close' : 'closed'} {formatDate(contest.submissionDeadline)}</span>
        {contest.votingDeadline && <span>Voting closes {formatDate(contest.votingDeadline)}</span>}
      </div>

      {contest.phase === 'submitting' && user?.status === 'builder' && (
        <section className="mb-8">
          <LabelCaps className="block mb-3">Submit</LabelCaps>
          <SubmitSection contest={contest} onSubmitted={load} />
        </section>
      )}

      {contest.phase === 'voting' && user?.status === 'builder' && (
        <section className="mb-8">
          <LabelCaps className="block mb-3">Vote</LabelCaps>
          <VoteSection contest={contest} />
        </section>
      )}

      {contest.phase !== 'submitting' && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={13} strokeWidth={1.8} className="text-gold-dark" />
            <LabelCaps>{contest.phase === 'completed' ? 'Final results' : 'Leaderboard'}</LabelCaps>
          </div>
          <LeaderboardSection contestId={contest.id} />
        </section>
      )}
    </div>
  )
}
