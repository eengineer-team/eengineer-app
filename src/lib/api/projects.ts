import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import { ME_ID } from '@/lib/profile-data'
import type { Project, ProjectKind, TeamMember, ProjectStat, SupportingMaterial, ProjectFeedback } from '@/lib/projects-data'

type ProjectUpdate = Database['public']['Tables']['projects']['Update']

// Supabase-backed replacement for the Projects-hub domain (distinct from a
// profile's portfolio ProjectEntry[], which lives in api/profiles.ts). All
// reads/writes go through here; projects-context.tsx only holds the
// in-memory snapshot and wires it to the same hook API components consume.
// RLS is the real authorization boundary — every write below relies on it.
//
// None of project_stats / project_team_members / project_join_requests /
// project_materials / project_feedback carry more than one FK to `profiles`,
// so unlike endorsements/connections in api/profiles.ts, none of these
// embeds are ambiguous and none need a `!constraint` hint.
const PROJECT_SELECT = `
  id, owner_id, name, description, kind, thumbnail_url, cover_url, link, telegram_url, instagram_url,
  open_to_recruitment,
  project_stats ( id, label, value ),
  project_materials ( id, name, url ),
  project_team_members ( id, name, role ),
  project_followers ( follower_id ),
  project_join_requests ( id, requester_id, profiles ( display_name ) ),
  project_feedback ( id, from_id, text, profiles ( display_name ) )
`

type ProjectRow = {
  id: string
  owner_id: string
  name: string
  description: string
  kind: string | null
  thumbnail_url: string | null
  cover_url: string | null
  link: string | null
  telegram_url: string | null
  instagram_url: string | null
  open_to_recruitment: boolean
  project_stats: { id: string; label: string; value: string }[]
  project_materials: { id: string; name: string | null; url: string }[]
  project_team_members: { id: string; name: string; role: string }[]
  project_followers: { follower_id: string }[]
  project_join_requests: { id: string; requester_id: string; profiles: { display_name: string } | null }[]
  project_feedback: { id: string; from_id: string; text: string; profiles: { display_name: string } | null }[]
}

const PROJECT_KINDS: ProjectKind[] = ['telegram', 'website', 'other']
function toKind(kind: string | null): ProjectKind {
  return PROJECT_KINDS.includes(kind as ProjectKind) ? (kind as ProjectKind) : 'other'
}

export async function currentUid(): Promise<string | null> {
  // Local cached read — see the note in api/community.ts's currentUid.
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id ?? null
}

// Every Builder gets a project row lazily, on first read — there's no
// signup-time trigger for `projects` the way there is for `profiles`. Keeps
// the "always exactly one project per Builder" guarantee the mock data had.
//
// This must be a single atomic upsert, not a select-then-insert: two calls
// racing (double effect invocation, multiple tabs, a fast remount) could
// each see "no row yet" and each insert one. That race actually happened —
// it silently produced dozens of duplicate empty rows per Builder before the
// unique constraint on owner_id existed (see migration
// 20260720150000_projects_owner_unique.sql), and once a Builder had more
// than one row, fetchProjects()'s .maybeSingle() started throwing on every
// load, taking down the whole Projects Hub for that account. onConflict +
// ignoreDuplicates relies on the DB constraint to make concurrent calls a
// no-op instead of a duplicate.
async function ensureMyProject(uid: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .upsert({ owner_id: uid }, { onConflict: 'owner_id', ignoreDuplicates: true })
  if (error) throw error
}

export async function fetchProjects(): Promise<Project[]> {
  const uid = await currentUid()
  if (uid) await ensureMyProject(uid)

  const { data: rows, error } = await supabase.from('projects').select(PROJECT_SELECT)
  if (error) throw error
  const projectRows = (rows ?? []) as unknown as ProjectRow[]

  return projectRows.map((row): Project => {
    const isMine = uid !== null && row.owner_id === uid
    return {
      id: row.id,
      ownerId: isMine ? ME_ID : row.owner_id,
      name: row.name,
      description: row.description,
      kind: toKind(row.kind),
      thumbnailUrl: row.thumbnail_url ?? undefined,
      coverUrl: row.cover_url ?? undefined,
      link: row.link ?? undefined,
      telegramUrl: row.telegram_url ?? undefined,
      instagramUrl: row.instagram_url ?? undefined,
      stats: row.project_stats.map((s): ProjectStat => ({ id: s.id, label: s.label, value: s.value })),
      supportingMaterials: row.project_materials.map((m): SupportingMaterial => ({
        id: m.id,
        label: m.name ?? '',
        url: m.url,
      })),
      openToRecruitment: row.open_to_recruitment,
      team: row.project_team_members.map((t): TeamMember => ({ id: t.id, name: t.name, role: t.role })),
      joinRequests: row.project_join_requests.map((r) => r.profiles?.display_name ?? 'A Builder'),
      followerIds: row.project_followers.map((f) => (f.follower_id === uid ? ME_ID : f.follower_id)),
      feedback: row.project_feedback.map((f): ProjectFeedback => ({
        id: f.id,
        fromName: f.profiles?.display_name ?? 'A Builder',
        text: f.text,
      })),
    }
  })
}

export async function updateMyProject(uid: string, patch: ProjectUpdate): Promise<void> {
  const { error } = await supabase.from('projects').update(patch).eq('owner_id', uid)
  if (error) throw error
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}

export async function addStat(uid: string, label: string, value: string): Promise<void> {
  const { data: project, error: findError } = await supabase.from('projects').select('id').eq('owner_id', uid).single()
  if (findError) throw findError
  const { error } = await supabase.from('project_stats').insert({ project_id: project.id, label, value })
  if (error) throw error
}

export async function removeStat(statId: string): Promise<void> {
  const { error } = await supabase.from('project_stats').delete().eq('id', statId)
  if (error) throw error
}

export async function addSupportingMaterial(uid: string, label: string, url: string): Promise<void> {
  const { data: project, error: findError } = await supabase.from('projects').select('id').eq('owner_id', uid).single()
  if (findError) throw findError
  const { error } = await supabase.from('project_materials').insert({ project_id: project.id, name: label, url, kind: 'link' })
  if (error) throw error
}

export async function removeSupportingMaterial(materialId: string): Promise<void> {
  const { error } = await supabase.from('project_materials').delete().eq('id', materialId)
  if (error) throw error
}

export async function addTeamMember(uid: string, name: string, role: string): Promise<void> {
  const { data: project, error: findError } = await supabase.from('projects').select('id').eq('owner_id', uid).single()
  if (findError) throw findError
  const { error } = await supabase.from('project_team_members').insert({ project_id: project.id, name, role })
  if (error) throw error
}

export async function removeTeamMember(memberId: string): Promise<void> {
  const { error } = await supabase.from('project_team_members').delete().eq('id', memberId)
  if (error) throw error
}

export async function toggleJoinRequest(uid: string, projectId: string, alreadyRequested: boolean): Promise<void> {
  if (alreadyRequested) {
    const { error } = await supabase
      .from('project_join_requests')
      .delete()
      .eq('project_id', projectId)
      .eq('requester_id', uid)
    if (error) throw error
    return
  }
  const { error } = await supabase.from('project_join_requests').insert({ project_id: projectId, requester_id: uid })
  if (error) throw error
}

export async function toggleFollow(uid: string, projectId: string, alreadyFollowing: boolean): Promise<void> {
  if (alreadyFollowing) {
    const { error } = await supabase
      .from('project_followers')
      .delete()
      .eq('project_id', projectId)
      .eq('follower_id', uid)
    if (error) throw error
    return
  }
  const { error } = await supabase.from('project_followers').insert({ project_id: projectId, follower_id: uid })
  if (error) throw error
}

export async function addFeedback(uid: string, projectId: string, text: string): Promise<void> {
  const { error } = await supabase.from('project_feedback').insert({ project_id: projectId, from_id: uid, text })
  if (error) throw error
}

async function uploadDataUrlToProjectCovers(uid: string, dataUrl: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob()
  const ext = blob.type.split('/')[1] || 'jpg'
  const path = `${uid}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('project-covers').upload(path, blob, { upsert: true, contentType: blob.type })
  if (error) throw error
  return supabase.storage.from('project-covers').getPublicUrl(path).data.publicUrl
}

// A data URL means "the Builder just picked a local file" (FileReader use in
// ProjectDetail.tsx) — anything else is already a real URL and saved as-is.
async function resolveImageUrl(uid: string, url: string): Promise<string> {
  return url.startsWith('data:') ? uploadDataUrlToProjectCovers(uid, url) : url
}

export async function setThumbnail(uid: string, url: string): Promise<void> {
  const resolved = await resolveImageUrl(uid, url)
  await updateMyProject(uid, { thumbnail_url: resolved })
}

export async function setCover(uid: string, url: string): Promise<void> {
  const resolved = await resolveImageUrl(uid, url)
  await updateMyProject(uid, { cover_url: resolved })
}
