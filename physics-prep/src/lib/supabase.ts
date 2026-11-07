import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Null when env is not configured: the app must still run locally without a backend.
// Callers check `supabase` and show an offline notice instead of throwing.
// Deliberately NOT VITE_SUPABASE_*: this app is built inside the main eengineer.net deploy,
// whose VITE_SUPABASE_* point at the live eengineer database. Physics prep must use its own project.
const url = import.meta.env.VITE_PHYSICS_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_PHYSICS_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null

/** Ensures there is a session (anonymous sign-in) so Edge Functions can rate-limit per user. */
export async function ensureSession(): Promise<boolean> {
  if (!supabase) return false
  const { data } = await supabase.auth.getSession()
  if (data.session) return true
  const { error } = await supabase.auth.signInAnonymously()
  return !error
}
