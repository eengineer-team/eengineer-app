import { supabase } from '@/lib/supabase'

// Product feedback from the always-visible sidebar entry (post sign-in/
// sign-up only). Insert-only, no select policy -- the founder reviews
// submissions directly via SQL/dashboard, same pattern as waitlist_signups.
// See supabase/migrations/20260721200000_feedback.sql.

export async function currentUid(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id ?? null
}

export async function submitFeedback(uid: string, rating: number, message: string): Promise<void> {
  const { error } = await supabase.from('feedback').insert({
    profile_id: uid,
    rating,
    message: message.trim(),
  })
  if (error) throw error
}
