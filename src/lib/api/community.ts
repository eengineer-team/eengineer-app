import { supabase } from '@/lib/supabase'
import { ME_ID } from '@/lib/profile-data'
import type { Attachment } from '@/lib/attachments'
import type { Comment, Discipline, Introduction, Post, Question, Webinar } from '@/lib/community-data'
import type { JoinedClub } from '@/lib/clubs-data'

// Supabase-backed replacement for the Community domain 3 surfaces (Q&A,
// clubs, webinars/RSVP, networking intros, discussion feed). Each fetch
// function returns the same shape the mock SEED_* data used, so QAFeed /
// Webinars / JoinedClubs / Networking / Discussion keep their existing JSX
// and only swap where their state comes from. RLS is the real authorization
// boundary — every write below relies on it, never re-checks it.

export async function currentUid(): Promise<string | null> {
  // getSession() reads the cached session locally; getUser() used to be here
  // and hit GET /auth/v1/user over the network on every single refresh, which
  // put ~40 auth round-trips into a 20-second window once several contexts
  // were refreshing together.
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id ?? null
}

// Coarse relative-time label shared by every live feed here (questions,
// comments, introductions, discussion posts) — none of this data was ever
// hand-typed like the old webinar date strings, so unlike
// formatWebinarDate there's no "wrong weekday" risk, just a display format.
export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = diffMs / 60_000
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${Math.floor(diffMin)}m ago`
  const diffHr = diffMin / 60
  if (diffHr < 24) return `${Math.floor(diffHr)}h ago`
  const diffDay = diffHr / 24
  if (diffDay < 7) return `${Math.floor(diffDay)}d ago`
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function attachmentFromRow(row: {
  attachment_kind: string | null
  attachment_url: string | null
  attachment_name: string | null
}): Attachment | undefined {
  if (!row.attachment_url || !row.attachment_kind) return undefined
  return { kind: row.attachment_kind as Attachment['kind'], url: row.attachment_url, name: row.attachment_name ?? undefined }
}

// ── Q&A: questions + question_votes + question_comments ─────────────────────

// The FK names are mandatory here, not stylistic. question_votes and
// question_comments each hold an FK to questions AND an FK to profiles, so
// PostgREST treats them as junction tables and sees three different ways to
// reach profiles from questions (direct via author_id, plus a many-to-many
// through each of those). That's an ambiguous embed — PGRST201 — and the whole
// query 300s. Naming the constraint pins the one relationship we mean.
const QUESTION_SELECT = `
  id, discipline, author_id, text, reported, created_at,
  profiles!questions_author_id_fkey ( display_name ),
  question_votes ( user_id, vote ),
  question_comments (
    id, author_id, text, created_at,
    profiles!question_comments_author_id_fkey ( display_name )
  )
`

type QuestionRow = {
  id: string
  discipline: Discipline
  author_id: string
  text: string
  reported: boolean
  created_at: string
  profiles: { display_name: string } | null
  question_votes: { user_id: string; vote: 'approve' | 'disapprove' }[]
  question_comments: {
    id: string
    author_id: string
    text: string
    created_at: string
    profiles: { display_name: string } | null
  }[]
}

export async function fetchQuestions(): Promise<Question[]> {
  const uid = await currentUid()
  const { data, error } = await supabase.from('questions').select(QUESTION_SELECT).order('created_at', { ascending: true })
  if (error) throw error
  const rows = (data ?? []) as unknown as QuestionRow[]

  return rows.map((r): Question => {
    const myVote = uid ? r.question_votes.find((v) => v.user_id === uid)?.vote ?? null : null
    return {
      id: r.id,
      authorId: uid && r.author_id === uid ? ME_ID : r.author_id,
      category: r.discipline,
      text: r.text,
      author: r.profiles?.display_name ?? 'A Builder',
      time: formatRelativeTime(r.created_at),
      approvals: r.question_votes.filter((v) => v.vote === 'approve').length,
      disapprovals: r.question_votes.filter((v) => v.vote === 'disapprove').length,
      myVote,
      reported: r.reported,
      comments: r.question_comments
        .slice()
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((c): Comment => ({
          id: c.id,
          authorId: uid && c.author_id === uid ? ME_ID : c.author_id,
          author: c.profiles?.display_name ?? 'A Builder',
          text: c.text,
          time: formatRelativeTime(c.created_at),
        })),
    }
  })
}

export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await supabase.from('questions').delete().eq('id', id)
  if (error) throw error
}

export async function deleteQuestionComment(id: string): Promise<void> {
  const { error } = await supabase.from('question_comments').delete().eq('id', id)
  if (error) throw error
}

export async function postQuestion(uid: string, discipline: Discipline, text: string): Promise<void> {
  const { error } = await supabase.from('questions').insert({ discipline, author_id: uid, text })
  if (error) throw error
}

// Toggling the same vote again withdraws it, matching the old mock's
// "click again to un-vote" behavior — one row per (question, user) via PK.
export async function voteQuestion(
  uid: string,
  questionId: string,
  vote: 'approve' | 'disapprove',
  currentVote: 'approve' | 'disapprove' | null
): Promise<void> {
  if (currentVote === vote) {
    const { error } = await supabase.from('question_votes').delete().eq('question_id', questionId).eq('user_id', uid)
    if (error) throw error
    return
  }
  const { error } = await supabase.from('question_votes').upsert({ question_id: questionId, user_id: uid, vote })
  if (error) throw error
}

// `reports` is a staff-only queue (RLS: select restricted to community-lead/
// admin/super-admin) — an ordinary Builder can insert a report but can never
// read it back, so there is no server-verifiable "reported by anyone" state
// to show other viewers. The caller flips its own local `reported` flag
// optimistically after this resolves; it won't survive a refresh, which is
// the correct behavior for a queue regular Builders can't see into.
export async function reportQuestion(uid: string, questionId: string): Promise<void> {
  const { error } = await supabase.from('reports').insert({ reporter_id: uid, target_type: 'question', target_id: questionId })
  if (error) throw error
}

export async function commentQuestion(uid: string, questionId: string, text: string): Promise<void> {
  const { error } = await supabase.from('question_comments').insert({ question_id: questionId, author_id: uid, text })
  if (error) throw error
}

// ── Clubs ─────────────────────────────────────────────────────────────────

export async function fetchJoinedClubs(uid: string): Promise<JoinedClub[]> {
  const { data, error } = await supabase.from('club_memberships').select('discipline').eq('profile_id', uid)
  if (error) throw error
  return (data ?? []).map((r) => ({ name: r.discipline }))
}

export async function joinClub(uid: string, discipline: Discipline): Promise<void> {
  const { error } = await supabase.from('club_memberships').insert({ profile_id: uid, discipline })
  if (error) throw error
}

// ── Community hub stats ──────────────────────────────────────────────────
//
// Replaces the hardcoded per-discipline numbers that used to live in
// community-groups.ts (e.g. "412 members", "6 new this week" -- literal
// fake seed values, off by 100-200x from the real numbers). member_count/
// recent_activity_count come from the community_group_stats view (see
// migration 20260721190000), which is security_invoker so it's still
// subject to the underlying tables' RLS.

export interface CommunityGroupStats {
  memberCount: number
  recentActivityCount: number
}

type StatsRow = { discipline: Discipline; member_count: number; recent_activity_count: number }

export async function fetchCommunityGroupStats(): Promise<Record<Discipline, CommunityGroupStats>> {
  const { data, error } = await supabase.from('community_group_stats').select('discipline, member_count, recent_activity_count')
  if (error) throw error
  const result = {} as Record<Discipline, CommunityGroupStats>
  for (const row of (data ?? []) as unknown as StatsRow[]) {
    result[row.discipline] = { memberCount: row.member_count, recentActivityCount: row.recent_activity_count }
  }
  return result
}

export interface LatestGroupMessage {
  author: string
  text: string
  time: string
}

// Generic `profiles ( display_name )` is safe here (no `!constraint` hint
// needed) -- discussion_posts has no junction table into profiles, unlike
// questions (see the PGRST201 fix in api/admin.ts's resolveTargetContent).
const LATEST_MESSAGES_SELECT = `discipline, text, created_at, profiles ( display_name )`

type LatestMessageRow = {
  discipline: Discipline
  text: string
  created_at: string
  profiles: { display_name: string } | null
}

// "Latest message" preview in the JoinedClubs sidebar widget used to be
// invented (fake author names, fake quotes) -- this pulls the real most
// recent Discussion post per discipline. Fetches a bounded recent window
// or all disciplines) ordered by created_at desc and keeps only the first
// (most recent) row per discipline client-side, since PostgREST has no
// DISTINCT ON.
export async function fetchLatestGroupMessages(): Promise<Partial<Record<Discipline, LatestGroupMessage>>> {
  const { data, error } = await supabase
    .from('discussion_posts')
    .select(LATEST_MESSAGES_SELECT)
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error
  const result: Partial<Record<Discipline, LatestGroupMessage>> = {}
  for (const row of (data ?? []) as unknown as LatestMessageRow[]) {
    if (result[row.discipline]) continue
    result[row.discipline] = {
      author: row.profiles?.display_name ?? 'A Builder',
      text: row.text,
      time: formatRelativeTime(row.created_at),
    }
  }
  return result
}

export async function leaveClub(uid: string, discipline: Discipline): Promise<void> {
  const { error } = await supabase.from('club_memberships').delete().eq('profile_id', uid).eq('discipline', discipline)
  if (error) throw error
}

// ── Webinars + RSVPs ─────────────────────────────────────────────────────────

type WebinarRow = {
  id: string
  discipline: Discipline
  title: string
  speaker: string
  starts_at: string
  meeting_url: string | null
  duration_minutes: number
}

export async function fetchWebinars(): Promise<Webinar[]> {
  const uid = await currentUid()
  // Fetch from a generous look-back (4h) rather than strictly starts_at >=
  // now -- a webinar that started 10 minutes ago and is still "live" (see
  // isWebinarLive/durationMinutes) needs to stay visible with a Join
  // button, not vanish the instant its start time passes. The old strict
  // >= now filter is what previously showed a days-old webinar as "next"
  // forever once past -- this replaces that bug fix with a version that
  // also keeps genuinely-live webinars around, then drops truly-ended ones
  // client-side below.
  const lookback = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  const [{ data: webinars, error }, { data: rsvps, error: rsvpError }] = await Promise.all([
    supabase
      .from('webinars')
      .select('id, discipline, title, speaker, starts_at, meeting_url, duration_minutes')
      .gte('starts_at', lookback)
      .order('starts_at', { ascending: true }),
    supabase.from('webinar_rsvps').select('webinar_id, user_id'),
  ])
  if (error) throw error
  if (rsvpError) throw rsvpError

  const rsvpRows = rsvps ?? []
  const now = Date.now()
  return ((webinars ?? []) as WebinarRow[])
    .map((w): Webinar => ({
      id: w.id,
      discipline: w.discipline,
      title: w.title,
      speaker: w.speaker,
      startsAt: w.starts_at,
      meetingUrl: w.meeting_url,
      durationMinutes: w.duration_minutes,
      attending: rsvpRows.filter((r) => r.webinar_id === w.id).length,
      registered: uid ? rsvpRows.some((r) => r.webinar_id === w.id && r.user_id === uid) : false,
    }))
    .filter((w) => now < new Date(w.startsAt).getTime() + w.durationMinutes * 60_000)
}

export async function toggleWebinarRegistration(uid: string, webinarId: string, currentlyRegistered: boolean): Promise<void> {
  if (currentlyRegistered) {
    const { error } = await supabase.from('webinar_rsvps').delete().eq('webinar_id', webinarId).eq('user_id', uid)
    if (error) throw error
    return
  }
  const { error } = await supabase.from('webinar_rsvps').insert({ webinar_id: webinarId, user_id: uid })
  if (error) throw error
}

// ── Networking: one editable introduction per Builder ─────────────────────

const INTRODUCTION_SELECT = `
  id, profile_id, discipline, text, attachment_kind, attachment_url, attachment_name, created_at,
  profiles ( display_name )
`

type IntroductionRow = {
  id: string
  profile_id: string
  discipline: Discipline
  text: string
  attachment_kind: string | null
  attachment_url: string | null
  attachment_name: string | null
  created_at: string
  profiles: { display_name: string } | null
}

export async function fetchIntroductions(): Promise<Introduction[]> {
  const uid = await currentUid()
  const { data, error } = await supabase.from('introductions').select(INTRODUCTION_SELECT).order('created_at', { ascending: true })
  if (error) throw error
  return ((data ?? []) as unknown as IntroductionRow[]).map((r): Introduction => ({
    id: r.id,
    authorId: uid && r.profile_id === uid ? ME_ID : r.profile_id,
    name: r.profiles?.display_name ?? 'A Builder',
    discipline: r.discipline,
    text: r.text,
    time: formatRelativeTime(r.created_at),
    attachment: attachmentFromRow(r),
  }))
}

// One row per Builder (unique profile_id) — posting again edits it in place,
// same as the old mock's "find existing intro, else create" logic.
export async function upsertIntroduction(uid: string, discipline: Discipline, text: string, attachment: Attachment | undefined): Promise<void> {
  const { error } = await supabase.from('introductions').upsert(
    {
      profile_id: uid,
      discipline,
      text,
      attachment_kind: attachment?.kind ?? null,
      attachment_url: attachment?.url ?? null,
      attachment_name: attachment?.name ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'profile_id' }
  )
  if (error) throw error
}

export async function deleteIntroduction(id: string): Promise<void> {
  const { error } = await supabase.from('introductions').delete().eq('id', id)
  if (error) throw error
}

// ── Discussion: per-discipline chronological post feed ─────────────────────

const DISCUSSION_SELECT = `
  id, profile_id, discipline, text, attachment_kind, attachment_url, attachment_name, created_at,
  profiles ( display_name )
`

type DiscussionRow = {
  id: string
  profile_id: string
  discipline: Discipline
  text: string
  attachment_kind: string | null
  attachment_url: string | null
  attachment_name: string | null
  created_at: string
  profiles: { display_name: string } | null
}

export async function fetchDiscussionPosts(): Promise<Post[]> {
  const uid = await currentUid()
  const { data, error } = await supabase.from('discussion_posts').select(DISCUSSION_SELECT).order('created_at', { ascending: true })
  if (error) throw error
  return ((data ?? []) as unknown as DiscussionRow[]).map((r): Post => ({
    id: r.id,
    authorId: uid && r.profile_id === uid ? ME_ID : r.profile_id,
    name: r.profiles?.display_name ?? 'A Builder',
    discipline: r.discipline,
    text: r.text,
    time: formatRelativeTime(r.created_at),
    attachment: attachmentFromRow(r),
  }))
}

export async function postDiscussionPost(uid: string, discipline: Discipline, text: string, attachment: Attachment | undefined): Promise<void> {
  const { error } = await supabase.from('discussion_posts').insert({
    profile_id: uid,
    discipline,
    text,
    attachment_kind: attachment?.kind ?? null,
    attachment_url: attachment?.url ?? null,
    attachment_name: attachment?.name ?? null,
  })
  if (error) throw error
}

export async function deleteDiscussionPost(id: string): Promise<void> {
  const { error } = await supabase.from('discussion_posts').delete().eq('id', id)
  if (error) throw error
}
