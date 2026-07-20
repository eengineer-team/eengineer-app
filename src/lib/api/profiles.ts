import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import { ME_ID, MIN_ENDORSEMENT_REASON_LENGTH, type BuilderProfile, type ProjectEntry, type ExperienceEntry } from '@/lib/profile-data'
import type { Discipline } from '@/lib/community-data'

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

// Supabase-backed replacement for the profiles domain. All reads/writes go
// through here; profiles-context.tsx only holds the in-memory snapshot and
// wires it to the same hook API components already consume. RLS is the real
// authorization boundary — every write below relies on it, never re-checks it.

const PROFILE_SELECT = `
  id, display_name, discipline, bio, background_id, avatar_url, github_url, linkedin_url,
  open_to_work, interests, online, allow_dms, background_image_url,
  skills ( name, proficiency ),
  experiences ( id, role, organization, duration, description ),
  profile_project_entries ( id, title, year, description, image, video, skill_names ),
  endorsements!endorsements_profile_id_fkey ( id, from_id, target_type, target_name, reason, evidence_url )
`

type ProfileRow = {
  id: string
  display_name: string
  discipline: Discipline
  bio: string
  background_id: string
  avatar_url: string | null
  github_url: string | null
  linkedin_url: string | null
  open_to_work: boolean
  interests: string[]
  online: boolean
  allow_dms: boolean
  background_image_url: string | null
  skills: { name: string; proficiency: number }[]
  experiences: ExperienceEntry[]
  profile_project_entries: { id: string; title: string; year: number | null; description: string; image: string | null; video: string | null; skill_names: string[] }[]
  endorsements: { id: string; from_id: string; target_type: 'skill' | 'project'; target_name: string; reason: string; evidence_url: string | null }[]
}

export async function currentUid(): Promise<string | null> {
  // Local cached read — see the note in api/community.ts's currentUid.
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id ?? null
}

export async function fetchProfiles(): Promise<BuilderProfile[]> {
  const uid = await currentUid()

  const [{ data: rows, error }, { data: connRows }, { data: privateRow }] = await Promise.all([
    supabase.from('profiles').select(PROFILE_SELECT),
    uid
      ? supabase.from('connections').select('requester_id, addressee_id, status').eq('status', 'connected')
      : Promise.resolve({ data: [] as { requester_id: string; addressee_id: string; status: string }[] }),
    uid
      ? supabase.from('profile_private').select('birthdate, guardian_consent_email').eq('id', uid).maybeSingle()
      : Promise.resolve({ data: null }),
  ])
  if (error) throw error
  const profileRows = (rows ?? []) as unknown as ProfileRow[]

  const nameById = new Map(profileRows.map((r) => [r.id, r.display_name]))

  const connected = new Map<string, Set<string>>()
  for (const c of connRows ?? []) {
    if (!connected.has(c.requester_id)) connected.set(c.requester_id, new Set())
    if (!connected.has(c.addressee_id)) connected.set(c.addressee_id, new Set())
    connected.get(c.requester_id)!.add(c.addressee_id)
    connected.get(c.addressee_id)!.add(c.requester_id)
  }

  let myOutgoingRequests = new Set<string>()
  if (uid) {
    const { data: reqRows } = await supabase
      .from('connections')
      .select('addressee_id')
      .eq('requester_id', uid)
      .eq('status', 'requested')
    myOutgoingRequests = new Set((reqRows ?? []).map((r) => r.addressee_id))
  }

  return profileRows.map((row): BuilderProfile => {
    const isMe = uid !== null && row.id === uid
    const connectStatus: BuilderProfile['connectStatus'] = isMe
      ? 'none'
      : connected.get(uid ?? '')?.has(row.id)
        ? 'connected'
        : myOutgoingRequests.has(row.id)
          ? 'requested'
          : 'none'
    const mutuals = isMe || !uid
      ? 0
      : [...(connected.get(uid) ?? [])].filter((id) => id !== row.id && connected.get(row.id)?.has(id)).length

    return {
      id: isMe ? ME_ID : row.id,
      name: row.display_name,
      discipline: row.discipline,
      online: row.online,
      bio: row.bio,
      backgroundId: row.background_id,
      backgroundImageUrl: row.background_image_url ?? undefined,
      avatarUrl: row.avatar_url ?? undefined,
      skills: row.skills.map((s) => ({ name: s.name, proficiency: s.proficiency })),
      projects: row.profile_project_entries.map((p): ProjectEntry => ({
        id: p.id,
        title: p.title,
        year: p.year ?? 0,
        description: p.description,
        image: p.image ?? undefined,
        video: p.video ?? undefined,
        skillNames: p.skill_names,
      })),
      experience: row.experiences,
      endorsements: row.endorsements.map((e) => ({
        id: e.id,
        fromName: nameById.get(e.from_id) ?? 'A Builder',
        targetType: e.target_type,
        targetName: e.target_name,
        reason: e.reason,
        evidenceUrl: e.evidence_url ?? undefined,
      })),
      githubUrl: row.github_url ?? undefined,
      linkedinUrl: row.linkedin_url ?? undefined,
      mutuals,
      connectStatus,
      openToWork: row.open_to_work,
      interests: row.interests,
      allowDMs: row.allow_dms,
      birthdate: isMe ? privateRow?.birthdate ?? undefined : undefined,
      guardianConsentEmail: isMe ? privateRow?.guardian_consent_email ?? undefined : undefined,
    }
  })
}

async function uploadDataUrlToAvatars(uid: string, dataUrl: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob()
  const ext = blob.type.split('/')[1] || 'jpg'
  const path = `${uid}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('avatars').upload(path, blob, { upsert: true, contentType: blob.type })
  if (error) throw error
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
}

// A data URL means "the Builder just picked a local file" (see
// readFileAsAttachment / Onboarding's FileReader use) — anything else is
// already a real URL (an Unsplash sample background, or a previously-stored
// public URL) and can be saved as-is.
async function resolveImageUrl(uid: string, url: string): Promise<string> {
  return url.startsWith('data:') ? uploadDataUrlToAvatars(uid, url) : url
}

export async function updateMyProfile(uid: string, patch: ProfileUpdate): Promise<void> {
  const { error } = await supabase.from('profiles').update(patch).eq('id', uid)
  if (error) throw error
}

export async function setAvatar(uid: string, avatarUrl: string): Promise<void> {
  const url = await resolveImageUrl(uid, avatarUrl)
  await updateMyProfile(uid, { avatar_url: url })
}

export async function setBackground(uid: string, backgroundId: string): Promise<void> {
  await updateMyProfile(uid, { background_id: backgroundId, background_image_url: null })
}

export async function setBackgroundImage(uid: string, url: string | undefined): Promise<void> {
  const resolved = url ? await resolveImageUrl(uid, url) : null
  await updateMyProfile(uid, { background_image_url: resolved })
}

export async function rateSkill(uid: string, skillName: string, proficiency: number): Promise<void> {
  const { error } = await supabase.from('skills').update({ proficiency }).eq('profile_id', uid).eq('name', skillName)
  if (error) throw error
}

export async function addSkill(uid: string, skillName: string): Promise<void> {
  const { error } = await supabase.from('skills').insert({ profile_id: uid, name: skillName, proficiency: 3 })
  if (error) throw error
}

export async function addProject(uid: string, project: Omit<ProjectEntry, 'id'>): Promise<void> {
  const { error } = await supabase.from('profile_project_entries').insert({
    profile_id: uid,
    title: project.title,
    year: project.year,
    description: project.description,
    image: project.image ?? null,
    video: project.video ?? null,
    skill_names: project.skillNames,
  })
  if (error) throw error
}

export async function addExperience(uid: string, entry: Omit<ExperienceEntry, 'id'>): Promise<void> {
  const { error } = await supabase.from('experiences').insert({
    profile_id: uid,
    role: entry.role,
    organization: entry.organization,
    duration: entry.duration,
    description: entry.description,
  })
  if (error) throw error
}

export async function setBirthdate(uid: string, birthdate: string): Promise<void> {
  const { error } = await supabase.from('profile_private').upsert({ id: uid, birthdate })
  if (error) throw error
}

export async function setGuardianConsent(uid: string, guardianEmail: string): Promise<void> {
  const { error } = await supabase
    .from('profile_private')
    .upsert({ id: uid, guardian_consent_email: guardianEmail, guardian_consent_at: new Date().toISOString() })
  if (error) throw error
}

export async function addEndorsement(
  uid: string,
  targetProfileId: string,
  targetType: 'skill' | 'project',
  targetName: string,
  reason: string,
  evidenceUrl: string | undefined
): Promise<void> {
  if (reason.trim().length < MIN_ENDORSEMENT_REASON_LENGTH) return
  const { error } = await supabase.from('endorsements').insert({
    profile_id: targetProfileId,
    from_id: uid,
    target_type: targetType,
    target_name: targetName,
    reason: reason.trim(),
    evidence_url: evidenceUrl?.trim() || null,
  })
  if (error) throw error
}

export async function toggleConnect(
  uid: string,
  targetProfileId: string,
  currentStatus: BuilderProfile['connectStatus']
): Promise<void> {
  if (currentStatus === 'connected') return
  if (currentStatus === 'requested') {
    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('requester_id', uid)
      .eq('addressee_id', targetProfileId)
      .eq('status', 'requested')
    if (error) throw error
    return
  }
  const { error } = await supabase
    .from('connections')
    .insert({ requester_id: uid, addressee_id: targetProfileId, status: 'requested' })
  if (error) throw error
}
