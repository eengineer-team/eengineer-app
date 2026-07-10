import * as React from 'react'

export type OAuthProvider = 'github' | 'linkedin' | 'google'

// Builder is the default role for anyone verified via GitHub/LinkedIn OAuth.
// Community Lead / Admin / Super Admin are assigned later (Step 11 — no
// self-assign, no request-via-UI); until that admin flow exists, every mock
// sign-in lands as a plain Builder. See src/lib/permissions.ts for what each
// role can do.
export type Role = 'builder' | 'community-lead' | 'admin' | 'super-admin'

export type AuthUser =
  | { provider: 'github' | 'linkedin'; status: 'builder'; name: string; role: Role }
  | { provider: 'google'; status: 'preview' }

interface AuthContextValue {
  user: AuthUser | null
  signInWithProvider: (provider: OAuthProvider) => void
  updateName: (name: string) => void
  signOut: () => void
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

const SESSION_KEY = 'ee_session'

// Every localStorage key written by usePersistentState (profiles-context,
// projects-context, messages-context, Webinars, QAFeed, DashboardHome's RSVP)
// — cleared on sign-out so the next person to sign in doesn't inherit the
// previous user's mock data.
const PERSISTED_STATE_KEYS = [
  'ee:profiles',
  'ee:projects',
  'ee:messages',
  'ee:messages:activeId',
  'ee:webinars',
  'ee:qa-feed',
  'ee:dashboard-webinar-rsvp',
  'ee:start-here-dismissed',
]

// Greeting uses first name only. Falls back to "Builder" if the profile name
// is ever empty — never renders the raw provider label.
export function firstNameOf(fullName: string | undefined): string {
  const first = fullName?.trim().split(/\s+/)[0]
  return first || 'Builder'
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as AuthUser
      // Google preview is stateless by spec — never restored from storage,
      // even if something stale is somehow present.
      return parsed.status === 'builder' ? { ...parsed, role: parsed.role ?? 'builder' } : null
    } catch {
      return null
    }
  })

  const signInWithProvider = React.useCallback((provider: OAuthProvider) => {
    if (provider === 'google') {
      // Stateless preview: held only in memory, never persisted.
      setUser({ provider: 'google', status: 'preview' })
      return
    }
    // A real OAuth handshake would return the account's actual name here.
    // Mocked until a backend token exchange exists (see PROGRESS.md open
    // question #4) — so a brand-new sign-in has no name yet; it's collected
    // in Onboarding instead of faked. A returning session for the same
    // provider keeps whatever name it already had rather than blanking it.
    const raw = localStorage.getItem(SESSION_KEY)
    let existingName = ''
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as AuthUser
        if (parsed.status === 'builder' && parsed.provider === provider) existingName = parsed.name
      } catch {
        // ignore corrupt storage — falls back to blank name
      }
    }
    const builder: AuthUser = { provider, status: 'builder', name: existingName, role: 'builder' }
    localStorage.setItem(SESSION_KEY, JSON.stringify(builder))
    setUser(builder)
  }, [])

  const updateName = React.useCallback((name: string) => {
    setUser((prev) => {
      if (!prev || prev.status !== 'builder') return prev
      const updated: AuthUser = { ...prev, name }
      localStorage.setItem(SESSION_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const signOut = React.useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    for (const key of PERSISTED_STATE_KEYS) localStorage.removeItem(key)
    setUser(null)
  }, [])

  const value = React.useMemo(
    () => ({ user, signInWithProvider, updateName, signOut }),
    [user, signInWithProvider, updateName, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
