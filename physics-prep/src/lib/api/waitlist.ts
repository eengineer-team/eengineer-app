import { supabase } from '@/lib/supabase'

export type WaitlistResult = { ok: true } | { ok: false; reason: 'offline' | 'invalid' | 'error' }

/** Inserts into public.physics_waitlist (see supabase/migrations). Duplicate emails count as success. */
export async function joinWaitlist(email: string, source: string): Promise<WaitlistResult> {
  const clean = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return { ok: false, reason: 'invalid' }
  if (!supabase) return { ok: false, reason: 'offline' }
  const { error } = await supabase.from('physics_waitlist').insert({ email: clean, source })
  if (error && error.code !== '23505') return { ok: false, reason: 'error' }
  return { ok: true }
}
