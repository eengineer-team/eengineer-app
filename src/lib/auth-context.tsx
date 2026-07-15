import * as React from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export type OAuthProvider = 'github' | 'linkedin' | 'google'
export type Role = 'builder' | 'community-lead' | 'admin' | 'super-admin'

// Same shape the rest of the app already consumes — only the source changed
// (was a localStorage mock, now the real Supabase session + JWT claims injected
// by the custom access-token hook: user_status / user_role / user_verified).
export type AuthUser =
  | { provider: 'github' | 'linkedin'; status: 'builder'; name: string; role: Role }
  | { provider: 'google'; status: 'preview' }

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  signInWithProvider: (provider: OAuthProvider, redirectPath?: string) => void
  updateName: (name: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function firstNameOf(fullName: string | undefined): string {
  const first = fullName?.trim().split(/\s+/)[0]
  return first || 'Builder'
}

// The custom claims live in the access-token JWT (added by
// public.custom_access_token_hook). Decode the payload to read them client-side.
function decodeClaims(token?: string): Record<string, unknown> | null {
  if (!token) return null
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

function deriveUser(session: Session | null): AuthUser | null {
  if (!session) return null
  const claims = decodeClaims(session.access_token) ?? {}
  const provider = (session.user.app_metadata?.provider as string | undefined) ?? ''
  // Fall back to the provider if the hook hasn't populated claims yet (e.g. the
  // dashboard hook isn't enabled) so the UI still reflects a logged-in session.
  const status =
    (claims.user_status as string | undefined) ??
    (provider === 'github' || provider.startsWith('linkedin') ? 'builder' : 'preview')

  if (status === 'builder') {
    const meta = (session.user.user_metadata ?? {}) as Record<string, string>
    const name = meta.name || meta.full_name || meta.user_name || ''
    const role = ((claims.user_role as Role | undefined) ?? 'builder') as Role
    return {
      provider: provider.startsWith('linkedin') ? 'linkedin' : 'github',
      status: 'builder',
      name,
      role,
    }
  }
  return { provider: 'google', status: 'preview' }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  // Locally-set name (onboarding) takes precedence over the JWT-derived name
  // until the profiles domain reads display_name from the DB on load.
  const [nameOverride, setNameOverride] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setUser(deriveUser(data.session))
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(deriveUser(session))
      setNameOverride(null)
      setLoading(false)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signInWithProvider = React.useCallback(
    (provider: OAuthProvider, redirectPath = '/dashboard') => {
      // LinkedIn is the OIDC provider in Supabase.
      const p = provider === 'linkedin' ? 'linkedin_oidc' : provider
      void supabase.auth.signInWithOAuth({
        provider: p as OAuthProvider,
        options: { redirectTo: `${window.location.origin}${redirectPath}` },
      })
    },
    []
  )

  const updateName = React.useCallback(async (name: string) => {
    setNameOverride(name)
    const { data } = await supabase.auth.getUser()
    if (data.user) {
      await supabase.from('profiles').update({ display_name: name }).eq('id', data.user.id)
    }
  }, [])

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setNameOverride(null)
  }, [])

  const effectiveUser = React.useMemo<