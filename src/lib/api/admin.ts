import { supabase } from '@/lib/supabase'
import type { Discipline } from '@/lib/community-data'
import type { Role } from '@/lib/auth-context'

// Supabase-backed data layer for /dashboard/admin. Every write here relies on
// RLS to actually allow or deny it (see supabase/migrations/20260720120000_moderation.sql)
// — this module only shapes queries/mutations, it never re-implements
// authorization. Every destructive action takes a reason and writes a
// moderation_actions row; there is no code path that skips the log.

export type ModerationTargetType =
  | 'question'
  | 'question_comment'
  | 'introduction'
  | 'discussion_post'
  | 'activity_update'

type ContentTableName = 'questions' | 'question_comments' | 'introductions' | 'discussion_posts' | 'activity_updates'

const TARGET_TABLES: Record<ModerationTargetType, ContentTableName> = {
  question: 'questions',
  question_comment: 'question_comments',
  introduction: 'introductions',
  discussion_post: 'discussion_posts',
  activity_update: 'activity_updates',
}

// author_id column differs per table.
const TARGET_AUTHOR_COL: Record<ModerationTargetType, string> = {
  question: 'author_id',
  question_comment: 'author_id',
  introduction: 'profile_id',
  discussion_post: 'profile_id',
  activity_update: 'author_id',
}

export interface ReportRow {
  id: string
  reporterId: string
  reporterName: string
  targetType: string
  targetId: string
  reason: string
  status: 'open' | 'actioned' | 'dismissed'
  createdAt: string
  resolvedBy: string | null
  resolvedAt: string | null
}

const REPORT_SELECT = `
  id, reporter_id, target_type, target_id, reason, status, created_at, resolved_by, resolved_at,
  profiles!reports_reporter_id_fkey ( display_name )
`

type ReportSelectRow = {
  id: string
  reporter_id: string
  target_type: string
  target_id: string
  reason: string
  status: string
  created_at: string
  resolved_by: string | null
  resolved_at: string | null
  profiles: { display_name: string } | null
}

export async function fetchReports(status: 'open' | 'actioned' | 'dismissed' | 'all' = 'open'): Promise<ReportRow[]> {
  let query = supabase.from('reports').select(REPORT_SELECT).order('created_at', { ascending: false })
  if (status !== 'all') query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw error
  return ((data ?? []) as unknown as ReportSelectRow[]).map((r) => ({
    id: r.id,
    reporterId: r.reporter_id,
    reporterName: r.profiles?.display_name ?? 'A Builder',
    targetType: r.target_type,
    targetId: r.target_id,
    reason: r.reason,
    status: r.status as ReportRow['status'],
    createdAt: r.created_at,
    resolvedBy: r.resolved_by,
    resolvedAt: r.resolved_at,
  }))
}

export interface ResolvedTargetContent {
  exists: boolean
  text: string
  authorId: string
  authorName: string
}

// Reads the current content a report points at, so staff can see what's
// actually being reported before acting on it. Returns exists: false rather
// than throwing when the row is already gone (deleted separately, or a
// dangling report) — the UI needs to say so plainly and still allow dismiss.
export async function resolveTargetContent(targetType: string, targetId: string): Promise<ResolvedTargetContent> {
  const table = TARGET_TABLES[targetType as ModerationTargetType]
  if (!table) return { exists: false, text: '', authorId: '', authorName: '' }
  const authorCol = TARGET_AUTHOR_COL[targetType as ModerationTargetType]
  const { data, error } = await supabase
    .from(table)
    .select(`text, ${authorCol}, profiles!inner ( display_name )`)
    .eq('id', targetId)
    .maybeSingle()
  if (error) throw error
  if (!data) return { exists: false, text: '', authorId: '', authorName: '' }
  const row = data as unknown as { text: string; profiles: { display_name: string } | null } & Record<string, string>
  return {
    exists: true,
    text: row.text,
    authorId: row[authorCol],
    authorName: row.profiles?.display_name ?? 'A Builder',
  }
}

// Shared removal path for both the report queue and the content browser:
// snapshot the text, log it, delete the row, and — if this removal is
// resolving a specific report — flip that report to 'actioned'.
export async function removeContent(params: {
  moderatorId: string
  targetType: ModerationTargetType
  targetId: string
  reason: string
  reportId?: string
}): Promise<void> {
  const { moderatorId, targetType, targetId, reason, reportId } = params
  const table = TARGET_TABLES[targetType]
  const authorCol = TARGET_AUTHOR_COL[targetType]

  const { data: row, error: readError } = await supabase
    .from(table)
    .select(`text, ${authorCol}`)
    .eq('id', targetId)
    .maybeSingle()
  if (readError) throw readError

  const snapshot = (row as unknown as Record<string, string> | null)?.text ?? null
  const authorId = (row as unknown as Record<string, string> | null)?.[authorCol] ?? null

  const { error: logError } = await supabase.from('moderation_actions').insert({
    moderator_id: moderatorId,
    action: 'content_removed',
    target_type: targetType,
    target_id: targetId,
    target_author_id: authorId,
    content_snapshot: snapshot,
    reason,
  })
  if (logError) throw logError

  if (row) {
    const { error: deleteError } = await supabase.from(table).delete().eq('id', targetId)
    if (deleteError) throw deleteError
  }

  if (reportId) {
    const { error: reportError } = await supabase
      .from('reports')
      .update({ status: 'actioned', resolved_by: moderatorId, resolved_at: new Date().toISOString() })
      .eq('id', reportId)
    if (reportError) throw reportError
  }
}

export async function dismissReport(params: { moderatorId: string; reportId: string; reason: string }): Promise<void> {
  const { moderatorId, reportId, reason } = params
  const { data: report, error: readError } = await supabase
    .from('reports')
    .select('target_type, target_id')
    .eq('id', reportId)
    .maybeSingle()
  if (readError) throw readError

  const { error: logError } = await supabase.from('moderation_actions').insert({
    moderator_id: moderatorId,
    action: 'report_dismissed',
    target_type: report?.target_type ?? 'unknown',
    target_id: report?.target_id ?? null,
    reason,
  })
  if (logError) throw logError

  const { error: reportError } = await supabase
    .from('reports')
    .update({ status: 'dismissed', resolved_by: moderatorId, resolved_at: new Date().toISOString() })
    .eq('id', reportId)
  if (reportError) throw reportError
}

// ── Content browser (no report required) ────────────────────────────────────

export interface ContentRow {
  id: string
  targetType: ModerationTargetType
  discipline: Discipline | null
  text: string
  authorId: string
  authorName: string
  createdAt: string
}

const CONTENT_SELECT: Record<ModerationTargetType, string> = {
  question: `id, discipline, text, author_id, created_at, profiles!questions_author_id_fkey ( display_name )`,
  question_comment: `id, text, author_id, created_at, profiles!question_comments_author_id_fkey ( display_name ), questions ( discipline )`,
  introduction: `id, discipline, text, profile_id, created_at, profiles ( display_name )`,
  discussion_post: `id, discipline, text, profile_id, created_at, profiles ( display_name )`,
  activity_update: `id, discipline, text, author_id, created_at, profiles!activity_updates_author_id_fkey ( display_name )`,
}

export async function fetchContent(targetType: ModerationTargetType, discipline?: Discipline): Promise<ContentRow[]> {
  const table = TARGET_TABLES[targetType]
  // Table shape (and thus the eq() column union) varies per targetType, which
  // the union `table` type can't express precisely — the response is already
  // treated as unknown and hand-mapped below, so a loose builder here doesn't
  // give up any real safety.
  let query = supabase.from(table).select(CONTENT_SELECT[targetType]).order('created_at', { ascending: false }) as any // eslint-disable-line @typescript-eslint/no-explicit-any
  if (discipline && targetType !== 'question_comment') query = query.eq('discipline', discipline)
  const { data, error } = await query
  if (error) throw error

  return ((data ?? []) as unknown as Record<string, unknown>[]).map((r) => {
    const authorId = (r.author_id ?? r.profile_id) as string
    const profiles = r.profiles as { display_name: string } | null
    const disc = (r.discipline ?? (r.questions as { discipline: Discipline } | null)?.discipline ?? null) as Discipline | null
    return {
      id: r.id as string,
      targetType,
      discipline: disc,
      text: r.text as string,
      authorId,
      authorName: profiles?.display_name ?? 'A Builder',
      createdAt: r.created_at as string,
    }
  })
}

// ── Users (read-only in this block) ─────────────────────────────────────────

export interface AdminProfileRow {
  id: string
  displayName: string
  discipline: Discipline
  verified: boolean
  createdAt: string
}

export async function fetchAllProfiles(): Promise<AdminProfileRow[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, discipline, verified, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    displayName: r.display_name,
    discipline: r.discipline as Discipline,
    verified: r.verified,
    createdAt: r.created_at,
  }))
}

// ── Roles (super-admin only) ─────────────────────────────────────────────────

export interface AdminRoleRow {
  userId: string
  displayName: string
  role: Role
}

// user_roles.user_id references auth.users directly (not profiles), so
// PostgREST has no FK path to embed display_name — join client-side instead,
// same pattern as fetchProfiles joining connections in api/profiles.ts.
export async function fetchUserRoles(): Promise<AdminRoleRow[]> {
  const [{ data: roles, error: rolesError }, { data: profiles, error: profilesError }] = await Promise.all([
    supabase.from('user_roles').select('user_id, role'),
    supabase.from('profiles').select('id, display_name'),
  ])
  if (rolesError) throw rolesError
  if (profilesError) throw profilesError

  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.display_name]))
  return (roles ?? []).map((r) => ({
    userId: r.user_id,
    displayName: nameById.get(r.user_id) ?? 'A Builder',
    role: r.role,
  }))
}

// Role changes only affect the JWT on the next sign-in (custom access token
// hook re-reads user_roles at token-mint time) — the caller must tell the
// admin that in the UI, this function has no way to force it.
export async function assignRole(params: { moderatorId: string; userId: string; role: Role; reason: string }): Promise<void> {
  const { moderatorId, userId, role, reason } = params
  const { error: upsertError } = await supabase.from('user_roles').upsert({ user_id: userId, role }, { onConflict: 'user_id' })
  if (upsertError) throw upsertError

  const { error: logError } = await supabase.from('moderation_actions').insert({
    moderator_id: moderatorId,
    action: 'role_assigned',
    target_type: 'profile',
    target_id: userId,
    target_author_id: userId,
    reason: `${reason} (role: ${role})`,
  })
  if (logError) throw logError
}

export async function revokeRole(params: { moderatorId: string; userId: string; reason: string }): Promise<void> {
  const { moderatorId, userId, reason } = params
  const { error: updateError } = await supabase.from('user_roles').update({ role: 'builder' }).eq('user_id', userId)
  if (updateError) throw updateError

  const { error: logError } = await supabase.from('moderation_actions').insert({
    moderator_id: moderatorId,
    action: 'role_revoked',
    target_type: 'profile',
    target_id: userId,
    target_author_id: userId,
    reason,
  })
  if (logError) throw logError
}
