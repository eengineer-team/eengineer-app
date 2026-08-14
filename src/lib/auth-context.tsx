import * as React from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { verifiedProviderFrom, type VerifiedProvider } from '@/lib/verification'

export type OAuthProvider = 'github' | 'linkedin' | 'google'
export type Role = 'builder' | 'community-lead' | 'admin' | 'super-admin'

// Same shape the rest of the app already consumes — only the source changed
// (was a localStorage mock, now the real Supabase session + JWT claims injected
// by the custom access-token hook: user_status / user_role / user_verified).
export type AuthUser =
  | {
      // Google sits here too now. Membership and verification are separate
      // axes: a Google member has the same access as anyone else, they just
      // have no badge (verified: false, verifiedVia: undefined).
      provider: 'github' | 'linkedin' | 'google'
      status: 'builder'
      name: string
      role: Role
      /** From the user_verified JWT claim, which the access-token hook fills
       *  from profiles.verified. Shown as the check beside your own name. */
      verified: boolean
      /** From the user_provider claim — which linked account earned the check. */
      verifiedVia?: VerifiedProvider
    }
  | {
      // Residual state, not a product tier any more: a session that carries no
      // role claim. In practice that means the signup trigger hasn't landed yet
      // or the access-token hook is switched off — both transient. Kept so the
      // UI degrades to read-only instead of crashing on a missing role.
      provider: 'google'
      status: 'preview'
      /** Always false, spelled out rather than left absent so a caller can ask
       *  `user.verified` without first narrowing on status. */
      verified: false
    }

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  signInWithProvider: (provider: OAuthProvider, redirectPath?: string) => void
  /** Attaches a GitHub/LinkedIn identity to the *current* session rather than
   *  starting a second account, then refreshes the token so the new claims
   *  (and the badge) take effect. See Settings → Verification. */
  linkProvider: (provider: Exclude<OAuthProvider, 'google'>, redirectPath?: string) => Promise<void>
  /** Pulls a fresh access token so user_verified/user_provider reflect a
   *  just-completed link without a full sign-out. */
  refreshVerification: () => Promise<void>
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
    // Fallback for a token minted before the hook existed. Google is included
    // now: every member provider resolves to builder.
    (provider === 'github' || provider.startsWith('linkedin') || provider === 'google'
      ? 'builder'
      : 'preview')

  if (status === 'builder') {
    const meta = (session.user.user_metadata ?? {}) as Record<string, string>
    const name = meta.name || meta.full_name || meta.user_name || ''
    const role = ((claims.user_role as Role | undefined) ?? 'builder') as Role
    // user_provider is the authoritative answer (it comes from profiles, so it
    // survives an account that linked GitHub *after* signing up with Google,
    // where app_metadata.provider still says 'google'). The session provider is
    // only the fallback for a token minted before this claim existed.
    const via =
      verifiedProviderFrom(claims.user_provider as string | undefined) ??
      verifiedProviderFrom(provider)
    return {
      // `via` is undefined for a Google member — fall back to the session's own
      // provider rather than guessing 'github', which would have mislabelled
      // every Google account the moment they stopped being preview.
      provider: via ?? (provider === 'google' ? 'google' : 'github'),
      status: 'builder',
      name,
      role,
      verified: (claims.user_verified as boolean | undefined) ?? via !== undefined,
      verifiedVia: via,
    }
  }
  return { provider: 'google', status: 'preview', verified: false }
}

// Google decides on its own what to show when it receives a bare authorize
// request: with one signed-in account it picks that one silently, with none it
// falls back to the email+password form. `prompt=select_account` overrides
// that and always opens the account chooser, which is what people expect from
// a "Continue with Google" button — pick the account, don't retype a password.
//
// It cannot conjure a chooser out of nothing, though. In a browser (or profile,
// or incognito window) with no Google session at all there is nothing to choose
// between, so Google still asks for credentials. That is Google's screen, not
// ours, and no OAuth parameter changes it.
function providerQueryParams(provider: OAuthProvider): { queryParams?: Record<string, string> } {
  return provider === 'google' ? { queryParams: { prompt: 'select_account' } } : {}
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
        options: {
          redirectTo: `${window.location.origin}${redirectPath}`,
          ...providerQueryParams(provider),
        },
      })
    },
    []
  )

  // linkIdentity requires "Manual linking" to be enabled for the project
  // (Supabase → Authentication → Providers). It redirects through the provider
  // exactly like sign-in, but returns to an already-authenticated session and
  // adds a row to auth.identities — which is what the on_auth_identity_created
  // trigger watches to grant the profile, the builder role, and verified.
  const linkProvider = React.useCallback(
    async (provider: Exclude<OAuthProvider, 'google'>, redirectPath = '/dashboard/settings') => {
      const p = provider === 'linkedin' ? 'linkedin_oidc' : provider
      const { error } = await supabase.auth.linkIdentity({
        provider: p as OAuthProvider,
        options: {
          redirectTo: `${window.location.origin}${redirectPath}`,
          ...providerQueryParams(provider),
        },
      })
      if (error) throw error
    },
    []
  )

  // The claims are baked into the access token at mint time, so a fresh link
  // is invisible until the token is re-issued. Without this the user comes
  // back from GitHub still labelled "preview" until the token happens to
  // expire, which reads as the link having silently failed.
  const refreshVerification = React.useCallback(async () => {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) throw error
    setUser(deriveUser(data.session))
  }, [])

  const updateName = React.useCallback(async (name: string) => {
    setNameOverride(name)
    const { data } = await supabase.auth.getSession()
    const uid = data.session?.user?.id
    if (uid) {
      await supabase.from('profiles').update({ display_name: name }).eq('id', uid)
    }
  }, [])

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setNameOverride(null)
  }, [])

  const effectiveUser = React.useMemo<AuthUser | null>(() => {
    if (!user) return null
    if (user.status === 'builder' && nameOverride !== null) return { ...user, name: nameOverride }
    return user
  }, [user, nameOverride])

  const value = React.useMemo(
    () => ({
      user: effectiveUser,
      loading,
      signInWithProvider,
      linkProvider,
      refreshVerification,
      updateName,
      signOut,
    }),
    [effectiveUser, loading, signInWithProvider, linkProvider, refreshVerification, updateName, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
