import { supabase } from '@/lib/supabase'
import type { Discipline } from '@/lib/community-data'

// Data layer for the hidden /internal panel -- everything here used to be
// "founder reads it via SQL" only: waitlist_signups, feedback,
// competition_registrations. Access is enforced by RLS via
// app.is_internal_admin() (see supabase/migrations/20260723120000_internal_admins.sql),
// not by anything in this file -- these queries return empty results for
// anyone not on the internal_admins allowlist, same as an unauthenticated
// caller would see.

export async function amIInternalAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('am_i_internal_admin')
  if (error) throw error
  return data ?? false
}

// Separate email+password credential flow -- deliberately not the GitHub/
// LinkedIn OAuth used by the rest of the product (see app.handle_new_user:
// email/password signups never get a profiles row, so they can't leak into
// the builder-facing app even if someone finds this page).
export async function internalSignIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function internalSignUp(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
}

export async function internalSignOut(): Promise<void> {
  await supabase.auth.signOut()
}

export interface WaitlistSignup {
  id: string
  name: string
  email: string
  organization: string
  createdAt: string
}

export async function fetchWaitlist(): Promise<WaitlistSignup[]> {
  const { data, error } = await supabase
    .from('waitlist_signups')
    .select('id, name, email, organization, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    organization: r.organization,
    createdAt: r.created_at,
  }))
}

export interface FeedbackEntry {
  id: string
  profileId: string
  displayName: string | null
  rating: number
  message: string
  createdAt: string
}

// profiles!inner is safe here without a `!constraint` hint -- feedback has
// exactly one FK into profiles (see feedback_profile_id_fkey), no junction
// table ambiguity like the PGRST201 case in api/admin.ts.
export async function fetchFeedback(): Promise<FeedbackEntry[]> {
  const { data, error } = await supabase
    .from('feedback')
    .select('id, profile_id, rating, message, created_at, profiles ( display_name )')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    profileId: r.profile_id,
    displayName: (r.profiles as { display_name: string } | null)?.display_name ?? null,
    rating: r.rating,
    message: r.message,
    createdAt: r.created_at,
  }))
}

export interface CompetitionRegistrationEntry {
  id: string
  competitionId: string
  competitionName: string
  organizerEmail: string | null
  name: string
  email: string
  teamSchool: string
  createdAt: string
}

export async function fetchCompetitionRegistrations(): Promise<CompetitionRegistrationEntry[]> {
  const { data, error } = await supabase
    .from('competition_registrations')
    .select('id, competition_id, name, email, team_school, created_at, competitions ( name, organizer_email )')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r) => {
    const competition = r.competitions as { name: string; organizer_email: string | null } | null
    return {
      id: r.id,
      competitionId: r.competition_id,
      competitionName: competition?.name ?? 'Unknown competition',
      organizerEmail: competition?.organizer_email ?? null,
      name: r.name,
      email: r.email,
      teamSchool: r.team_school,
      createdAt: r.created_at,
    }
  })
}

export interface CompetitionOrganizerEmail {
  id: string
  name: string
  organizerEmail: string | null
}

export async function fetchCompetitionOrganizerEmails(): Promise<CompetitionOrganizerEmail[]> {
  const { data, error } = await supabase
    .from('competitions')
    .select('id, name, organizer_email')
    .order('name', { ascending: true })
  if (error) throw error
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, organizerEmail: r.organizer_email }))
}

export async function updateOrganizerEmail(competitionId: string, organizerEmail: string): Promise<void> {
  const { error } = await supabase
    .from('competitions')
    .update({ organizer_email: organizerEmail.trim() || null })
    .eq('id', competitionId)
  if (error) throw error
}

export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'open' | 'in_progress' | 'done'
export type TaskCategory = 'bug' | 'content' | 'design' | 'feature' | 'other'

const TASK_COLUMNS =
  'id, title, description, page_url, priority, status, author_name, claimed_by, due_date, category, screenshot_url, created_at, updated_at'

export interface InternalTask {
  id: string
  title: string
  description: string
  pageUrl: string | null
  priority: TaskPriority
  status: TaskStatus
  authorName: string
  claimedBy: string | null
  dueDate: string | null
  category: TaskCategory | null
  screenshotUrl: string | null
  createdAt: string
  updatedAt: string
}

function mapTask(r: {
  id: string
  title: string
  description: string
  page_url: string | null
  priority: string
  status: string
  author_name: string
  claimed_by: string | null
  due_date: string | null
  category: string | null
  screenshot_url: string | null
  created_at: string
  updated_at: string
}): InternalTask {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    pageUrl: r.page_url,
    priority: r.priority as TaskPriority,
    status: r.status as TaskStatus,
    authorName: r.author_name,
    claimedBy: r.claimed_by,
    dueDate: r.due_date,
    category: r.category as TaskCategory | null,
    screenshotUrl: r.screenshot_url,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export async function fetchTasks(): Promise<InternalTask[]> {
  const { data, error } = await supabase.from('internal_tasks').select(TASK_COLUMNS).order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapTask)
}

// Screenshot goes to its own public bucket, never into the row itself --
// the task only ever stores the resulting URL (see
// 20260730133000_internal_tasks_v2.sql). Uploaded before the insert so a
// failed upload doesn't leave a half-created task behind.
async function uploadTaskScreenshot(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'png'
  const path = `${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage
    .from('internal-task-screenshots')
    .upload(path, file, { contentType: file.type || 'image/png' })
  if (error) throw error
  return supabase.storage.from('internal-task-screenshots').getPublicUrl(path).data.publicUrl
}

export async function createTask(input: {
  title: string
  description: string
  pageUrl: string
  priority: TaskPriority
  authorName: string
  dueDate: string | null
  category: TaskCategory | null
  screenshotFile: File | null
}): Promise<InternalTask> {
  const screenshotUrl = input.screenshotFile ? await uploadTaskScreenshot(input.screenshotFile) : null
  const { data, error } = await supabase
    .from('internal_tasks')
    .insert({
      title: input.title.trim(),
      description: input.description.trim(),
      page_url: input.pageUrl.trim() || null,
      priority: input.priority,
      author_name: input.authorName.trim(),
      due_date: input.dueDate,
      category: input.category,
      screenshot_url: screenshotUrl,
    })
    .select(TASK_COLUMNS)
    .single()
  if (error) throw error
  return mapTask(data)
}

export async function setTaskStatus(id: string, status: TaskStatus): Promise<void> {
  const { error } = await supabase.from('internal_tasks').update({ status }).eq('id', id)
  if (error) throw error
}

// Claiming ("I'm on it") and unclaiming both go through this -- pass null to
// release. Doesn't force a status change, so someone can claim an open task
// without it silently jumping to in_progress if they're just triaging.
export async function claimTask(id: string, claimedBy: string | null): Promise<void> {
  const { error } = await supabase.from('internal_tasks').update({ claimed_by: claimedBy }).eq('id', id)
  if (error) throw error
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('internal_tasks').delete().eq('id', id)
  if (error) throw error
}

export interface TaskComment {
  id: string
  taskId: string
  authorName: string
  body: string
  createdAt: string
}

export async function fetchComments(taskId: string): Promise<TaskComment[]> {
  const { data, error } = await supabase
    .from('internal_task_comments')
    .select('id, task_id, author_name, body, created_at')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    taskId: r.task_id,
    authorName: r.author_name,
    body: r.body,
    createdAt: r.created_at,
  }))
}

export async function addComment(taskId: string, authorName: string, body: string): Promise<TaskComment> {
  const { data, error } = await supabase
    .from('internal_task_comments')
    .insert({ task_id: taskId, author_name: authorName.trim(), body: body.trim() })
    .select('id, task_id, author_name, body, created_at')
    .single()
  if (error) throw error
  return { id: data.id, taskId: data.task_id, authorName: data.author_name, body: data.body, createdAt: data.created_at }
}

export interface TeamMember {
  name: string
  role: string
}

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabase.from('internal_team_members').select('name, role').order('name', { ascending: true })
  if (error) throw error
  return data ?? []
}

// Upsert by name (the primary key) -- adding someone who's already listed
// just updates their role instead of erroring.
export async function upsertTeamMember(name: string, role: string): Promise<void> {
  const { error } = await supabase
    .from('internal_team_members')
    .upsert({ name: name.trim(), role: role.trim() }, { onConflict: 'name' })
  if (error) throw error
}

export async function deleteTeamMember(name: string): Promise<void> {
  const { error } = await supabase.from('internal_team_members').delete().eq('name', name)
  if (error) throw error
}

// Webinar management -- previously insert-only-by-hand-over-SQL (see
// community-data.ts's Webinar doc comment). internal_admin_write (see
// 20260802060000_hero_carousel.sql) is what actually lets these through:
// internal-panel accounts aren't Builders, so the app.is_builder()-gated
// web_write policy never applies to them.
export interface AdminWebinar {
  id: string
  discipline: Discipline
  title: string
  speaker: string
  speakerPhotoUrl: string | null
  speakerBio: string | null
  startsAt: string
  meetingUrl: string | null
  durationMinutes: number
  description: string | null
}

const ADMIN_WEBINAR_COLUMNS =
  'id, discipline, title, speaker, speaker_photo_url, speaker_bio, starts_at, meeting_url, duration_minutes, description'

function mapAdminWebinar(r: {
  id: string
  discipline: string
  title: string
  speaker: string
  speaker_photo_url: string | null
  speaker_bio: string | null
  starts_at: string
  meeting_url: string | null
  duration_minutes: number
  description: string | null
}): AdminWebinar {
  return {
    id: r.id,
    discipline: r.discipline as Discipline,
    title: r.title,
    speaker: r.speaker,
    speakerPhotoUrl: r.speaker_photo_url,
    speakerBio: r.speaker_bio,
    startsAt: r.starts_at,
    meetingUrl: r.meeting_url,
    durationMinutes: r.duration_minutes,
    description: r.description,
  }
}

export async function fetchAdminWebinars(): Promise<AdminWebinar[]> {
  const { data, error } = await supabase.from('webinars').select(ADMIN_WEBINAR_COLUMNS).order('starts_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapAdminWebinar)
}

// Speaker photo goes to its own public bucket, same pattern as
// internal-task-screenshots -- the row only ever stores the resulting URL.
export async function uploadSpeakerPhoto(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('webinar-speakers').upload(path, file, { contentType: file.type || 'image/jpeg' })
  if (error) throw error
  return supabase.storage.from('webinar-speakers').getPublicUrl(path).data.publicUrl
}

export interface AdminWebinarInput {
  discipline: Discipline
  title: string
  speaker: string
  speakerPhotoUrl: string | null
  speakerBio: string
  startsAt: string
  meetingUrl: string
  durationMinutes: number
  description: string
}

export async function createWebinar(input: AdminWebinarInput): Promise<AdminWebinar> {
  const { data, error } = await supabase
    .from('webinars')
    .insert({
      discipline: input.discipline,
      title: input.title.trim(),
      speaker: input.speaker.trim(),
      speaker_photo_url: input.speakerPhotoUrl,
      speaker_bio: input.speakerBio.trim() || null,
      starts_at: input.startsAt,
      meeting_url: input.meetingUrl.trim() || null,
      duration_minutes: input.durationMinutes,
      description: input.description.trim() || null,
    })
    .select(ADMIN_WEBINAR_COLUMNS)
    .single()
  if (error) throw error
  return mapAdminWebinar(data)
}

export async function updateWebinar(id: string, input: AdminWebinarInput): Promise<void> {
  const { error } = await supabase
    .from('webinars')
    .update({
      discipline: input.discipline,
      title: input.title.trim(),
      speaker: input.speaker.trim(),
      speaker_photo_url: input.speakerPhotoUrl,
      speaker_bio: input.speakerBio.trim() || null,
      starts_at: input.startsAt,
      meeting_url: input.meetingUrl.trim() || null,
      duration_minutes: input.durationMinutes,
      description: input.description.trim() || null,
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteWebinar(id: string): Promise<void> {
  const { error } = await supabase.from('webinars').delete().eq('id', id)
  if (error) throw error
}

