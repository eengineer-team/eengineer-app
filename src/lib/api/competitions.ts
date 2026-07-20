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

function mapCompetition(r: CompetitionRow): Competition {
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
  }
}

export async function fetchCompetitions(): Promise<Competition[]> {
  const { data, error } = await supabase.from('competitions').select('*').order('deadline', { ascending: true })
  if (error) throw error
  return ((data ?? []) as unknown as CompetitionRow[]).map(mapCompetition)
}
