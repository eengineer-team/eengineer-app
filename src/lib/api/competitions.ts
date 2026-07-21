import { supabase } from '@/lib/supabase'

// Supabase-backed replacement for calendar-data.ts's SEED_COMPETITIONS.
// comp_select requires app.is_builder() for `authenticated`, plus a public
// `comp_select_public` policy for `anon` (see
// supabase/migrations/20260720130000_competitions_anon_read.sql) — contest
// deadlines are public information, and LandingCalendar renders this on the
// pre-auth Welcome page where the visitor has no session at all.
//
// discipline is plain text here (not the Discipline enum, unlike
// opportunities) — don't assume the two line up.

export interface Competition {
  id: string
  name: string
  location: string
  remote: boolean
  discipline: string
  organizer: string
  description: string
  requirements: string[]
  deadline: Date
  // Whether the signed-in Builder has a real registration row -- not a
  // local toggle. Preview/signed-out sessions always see false.
  registered: boolean
}

type CompetitionRow = {
  id: string
  name: string
  location: string
  remote: boolean
  discipline: string
  organizer: string
  description: string
  requirements: string[]
  deadline: string
}

function mapCompetition(r: CompetitionRow, registeredIds: Set<string>): Competition {
  return {
    id: r.id,
    name: r.name,
    location: r.location,
    remote: r.remote,
    discipline: r.discipline,
    organizer: r.organizer,
    description: r.description,
    requirements: r.requirements,
    deadline: new Date(r.deadline),
    registered: registeredIds.has(r.id),
  }
}

export async function currentUid(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id ?? null
}

export async function fetchCompetitions(): Promise<Competition[]> {
  const uid = await currentUid()
  const [{ data, error }, myRegs] = await Promise.all([
    supabase.from('competitions').select('id, name, location, remote, discipline, organizer, description, requirements, deadline').order('deadline', { ascending: true }),
    uid
      ? supabase.from('competition_registrations').select('competition_id').eq('profile_id', uid)
      : Promise.resolve({ data: [] as { competition_id: string }[], error: null }),
  ])
  if (error) throw error
  if (myRegs.error) throw myRegs.error
  const registeredIds = new Set((myRegs.data ?? []).map((r) => r.competition_id))
  return ((data ?? []) as unknown as CompetitionRow[]).map((r) => mapCompetition(r, registeredIds))
}

export interface CompetitionRegistration {
  name: string
  email: string
  teamSchool: string
}

// Real registration: writes a row, then best-effort pings an Edge Function
// to notify the organizer (see supabase/functions/notify-competition-
// registration) -- that step is fire-and-forget and never blocks or fails
// the registration itself, since it depends on an email provider that may
// not be configured yet, and organizer_email may simply be null for a given
// competition.
export async function registerForCompetition(
  uid: string,
  competitionId: string,
  reg: CompetitionRegistration
): Promise<void> {
  const { error } = await supabase.from('competition_registrations').insert({
    competition_id: competitionId,
    profile_id: uid,
    name: reg.name,
    email: reg.email,
    team_school: reg.teamSchool,
  })
  if (error) throw error

  supabase.functions
    .invoke('notify-competition-registration', { body: { competitionId, ...reg } })
    .catch((err) => console.error('Organizer notification failed (registration itself still succeeded)', err))
}

export async function unregisterFromCompetition(uid: string, competitionId: string): Promise<void> {
  const { error } = await supabase
    .from('competition_registrations')
    .delete()
    .eq('competition_id', competitionId)
    .eq('profile_id', uid)
  if (error) throw error
}
