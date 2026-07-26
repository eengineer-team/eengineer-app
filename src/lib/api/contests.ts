import { supabase } from '@/lib/supabase'
import type { Discipline } from '@/lib/community-data'

// Contests -- deadline-based tasks judged by blind Tinder-style peer
// voting (Elo rating), not the live 1-vs-19 bracket or algorithmic judging
// originally floated. See supabase/migrations/20260724150000_contests.sql
// for the full reasoning and the RLS shape (blind: submissions only become
// readable to non-authors once the submission deadline passes; you can
// never vote on a pair including your own entry).

export type ContestPhase = 'submitting' | 'voting' | 'completed'

export interface Contest {
  id: string
  title: string
  description: string
  discipline: Discipline | null
  submissionDeadline: string
  votingDeadline: string | null
  submissionCount: number
  mySubmission: ContestSubmission | null
  phase: ContestPhase
}

export interface ContestSubmission {
  id: string
  contestId: string
  profileId: string
  content: string
  imageUrl: string | null
  eloRating: number
  wins: number
  losses: number
  createdAt: string
}

export function contestPhase(c: { submissionDeadline: string; votingDeadline: string | null }): ContestPhase {
  const now = Date.now()
  if (now < new Date(c.submissionDeadline).getTime()) return 'submitting'
  if (c.votingDeadline && now >= new Date(c.votingDeadline).getTime()) return 'completed'
  return 'voting'
}

export async function currentUid(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id ?? null
}

type ContestRow = {
  id: string
  title: string
  description: string
  discipline: Discipline | null
  submission_deadline: string
  voting_deadline: string | null
}

export async function fetchContests(): Promise<Contest[]> {
  const uid = await currentUid()
  const [{ data: contests, error }, mine] = await Promise.all([
    supabase
      .from('contests')
      .select('id, title, description, discipline, submission_deadline, voting_deadline')
      .order('submission_deadline', { ascending: false }),
    uid
      ? supabase
          .from('contest_submissions')
          .select('id, contest_id, profile_id, content, image_url, elo_rating, wins, losses, created_at')
          .eq('profile_id', uid)
      : Promise.resolve({ data: [] as ContestSubmissionRow[], error: null }),
  ])
  if (error) throw error
  if (mine.error) throw mine.error

  // Submission counts: a cheap per-contest count via a second query rather
  // than embedding, since RLS on contest_submissions hides other people's
  // rows until the deadline passes -- a straight count(*) still works
  // because it only counts rows the caller is allowed to see, which for a
  // still-open contest is just their own (0 or 1), and for a closed one is
  // everyone's real count.
  const { data: counts, error: countsError } = await supabase.from('contest_submissions').select('contest_id')
  if (countsError) throw countsError

  const mySubmissionsByContest = new Map((mine.data ?? []).map((s) => [s.contest_id, mapSubmission(s)]))
  const countByContest = new Map<string, number>()
  for (const row of counts ?? []) {
    countByContest.set(row.contest_id, (countByContest.get(row.contest_id) ?? 0) + 1)
  }

  return ((contests ?? []) as ContestRow[]).map((c) => {
    const submissionDeadline = c.submission_deadline
    const votingDeadline = c.voting_deadline
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      discipline: c.discipline,
      submissionDeadline,
      votingDeadline,
      submissionCount: countByContest.get(c.id) ?? 0,
      mySubmission: mySubmissionsByContest.get(c.id) ?? null,
      phase: contestPhase({ submissionDeadline, votingDeadline }),
    }
  })
}

/** Signed-out read for the public /contest page.
 *
 *  Deliberately touches ONLY the contests table. fetchContests() also queries
 *  contest_submissions for counts and for "my entry", and every policy on
 *  that table is scoped to the `authenticated` role -- for an anonymous
 *  visitor those come back empty anyway, so running them is a wasted
 *  round-trip on the one page where first paint matters most. */
export async function fetchPublicContests(): Promise<
  Pick<Contest, 'id' | 'title' | 'description' | 'discipline' | 'submissionDeadline' | 'votingDeadline' | 'phase'>[]
> {
  const { data, error } = await supabase
    .from('contests')
    .select('id, title, description, discipline, submission_deadline, voting_deadline')
    .order('title', { ascending: true })
  if (error) throw error

  return ((data ?? []) as ContestRow[]).map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    discipline: c.discipline,
    submissionDeadline: c.submission_deadline,
    votingDeadline: c.voting_deadline,
    phase: contestPhase({ submissionDeadline: c.submission_deadline, votingDeadline: c.voting_deadline }),
  }))
}

type ContestSubmissionRow = {
  id: string
  contest_id: string
  profile_id: string
  content: string
  image_url: string | null
  elo_rating: number
  wins: number
  losses: number
  created_at: string
}

function mapSubmission(r: ContestSubmissionRow): ContestSubmission {
  return {
    id: r.id,
    contestId: r.contest_id,
    profileId: r.profile_id,
    content: r.content,
    imageUrl: r.image_url,
    eloRating: r.elo_rating,
    wins: r.wins,
    losses: r.losses,
    createdAt: r.created_at,
  }
}

export async function submitEntry(contestId: string, profileId: string, content: string, imageUrl?: string): Promise<void> {
  const { error } = await supabase.from('contest_submissions').insert({
    contest_id: contestId,
    profile_id: profileId,
    content: content.trim(),
    image_url: imageUrl?.trim() || null,
  })
  if (error) throw error
}

// Leaderboard -- everyone's entries, ranked by Elo. Only returns real data
// once the submission deadline has passed (RLS); before that it comes back
// empty for anyone but yourself, which the UI treats as "not open yet"
// rather than an error.
export async function fetchLeaderboard(contestId: string): Promise<ContestSubmission[]> {
  const { data, error } = await supabase
    .from('contest_submissions')
    .select('id, contest_id, profile_id, content, image_url, elo_rating, wins, losses, created_at')
    .eq('contest_id', contestId)
    .order('elo_rating', { ascending: false })
  if (error) throw error
  return ((data ?? []) as ContestSubmissionRow[]).map(mapSubmission)
}

// Voting queue: fetch every entry (minus your own) and your past votes,
// then pick a random unseen pair client-side. Fine at contest scale (tens,
// not thousands of entries) and keeps the "who am I comparing" logic out
// of SQL. Submission rows never expose profile_id to the vote UI -- see
// ContestVote.tsx, which only reads .content/.imageUrl from these.
export async function fetchVotingPool(
  contestId: string,
  myProfileId: string
): Promise<{ candidates: ContestSubmission[]; votedPairs: Set<string> }> {
  const [{ data: subs, error }, { data: votes, error: votesError }] = await Promise.all([
    supabase
      .from('contest_submissions')
      .select('id, contest_id, profile_id, content, image_url, elo_rating, wins, losses, created_at')
      .eq('contest_id', contestId),
    supabase.from('contest_votes').select('submission_a_id, submission_b_id').eq('contest_id', contestId),
  ])
  if (error) throw error
  if (votesError) throw votesError

  const candidates = ((subs ?? []) as ContestSubmissionRow[])
    .filter((s) => s.profile_id !== myProfileId)
    .map(mapSubmission)

  const votedPairs = new Set(
    (votes ?? []).map((v) => [v.submission_a_id, v.submission_b_id].sort().join('|'))
  )

  return { candidates, votedPairs }
}

export async function castVote(
  contestId: string,
  voterId: string,
  submissionAId: string,
  submissionBId: string,
  winnerId: string
): Promise<void> {
  const { error } = await supabase.from('contest_votes').insert({
    contest_id: contestId,
    voter_id: voterId,
    submission_a_id: submissionAId,
    submission_b_id: submissionBId,
    winner_id: winnerId,
  })
  if (error) throw error
}

// Contest registration -- deliberately decoupled from both `contests` and
// eengineer accounts (see supabase/migrations/20260726160000_contest_registrations.sql).
// A 12-year-old registers with name + region + age bracket + a Telegram
// handle; nothing here touches auth. Anon can insert but never read a row
// back, so this never returns the inserted row -- just throws on failure.

export type ContestAgeGroup = 'junior' | 'senior'

/** Strips a leading "@", lowercases, trims -- so "@Foo" and "foo" store and
 *  dedupe identically. Format itself (5-32 chars, a-z0-9_) is enforced by
 *  the table's check constraints, not here. */
export function normalizeTelegramHandle(raw: string): string {
  return raw.trim().replace(/^@/, '').toLowerCase()
}

export interface ContestRegistrationInput {
  name: string
  region: string
  ageGroup: ContestAgeGroup
  contactTelegram: string
  guardianTelegram?: string
  contactEmail?: string
}

export async function registerForContest(input: ContestRegistrationInput): Promise<void> {
  const { error } = await supabase.from('contest_registrations').insert({
    name: input.name.trim(),
    region: input.region.trim(),
    age_group: input.ageGroup,
    contact_telegram: normalizeTelegramHandle(input.contactTelegram),
    guardian_telegram: input.guardianTelegram ? normalizeTelegramHandle(input.guardianTelegram) : null,
    contact_email: input.contactEmail?.trim() || null,
  })
  if (error) throw error
}

export interface ContestInquiryInput {
  name?: string
  contact: string
  message: string
}

export async function submitContestInquiry(input: ContestInquiryInput): Promise<void> {
  const { error } = await supabase.from('contest_inquiries').insert({
    name: input.name?.trim() || null,
    contact: input.contact.trim(),
    message: input.message.trim(),
  })
  if (error) throw error
}
