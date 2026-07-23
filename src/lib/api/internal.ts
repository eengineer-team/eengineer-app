import { supabase } from '@/lib/supabase'

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
