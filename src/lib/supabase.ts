import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

// Single typed Supabase client for the whole app. URL + publishable key come
// from env (see .env.local / .env.example). The publishable key is safe to ship
// in a client bundle — row access is enforced by RLS, not by hiding the key.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

if (!url || !key) {
  // Fail loudly in dev rather than silently making unauthenticated calls.
  throw new Error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env.local.'
  )
}

export const supabase = createClient<Database>(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // completes the OAuth redirect handshake
  },
})
