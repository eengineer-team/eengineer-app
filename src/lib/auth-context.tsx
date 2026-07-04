import * as React from 'react'

export type OAuthProvider = 'github' | 'linkedin' | 'google'

export type AuthUser =
  | { provider: 'github' | 'linkedin'; status: 'builder'; name: string }
  | { provider: 'google'; status: 'preview' }

interface AuthContextValue {
  user: AuthUser | null
  signInWithProvider: (provider: OAuthProvider) => void
  signOut: () => void
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

const SESSION_KEY = 'ee_session'

// GitHub/LinkedIn OAuth is mocked until a real backend token exchange exists —
// see PROGRESS.md open question #4. Only the resulting Builder session shape
// is real; the provider handshake itself is not.
function mockBuilderName(provider: 'github' | 'linkedin') {
  return provider === 'github' ? 'GitHub Builder' : 'LinkedIn Builder'
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as AuthUser
      // Google preview is stateless by spec — never restored from storage,
      // even if something stale is somehow present.
      return parsed.status === 'builder' ? parsed : null
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
    const builder: AuthUser = { provider, status: 'builder', name: mockBuilderName(provider) }
    localStorage.setItem(SESSION_KEY, JSON.stringify(builder))
    setUser(builder)
  }, [])

  const signOut = React.useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }, [])

  const value = React.useMemo(
    () => ({ user, signInWithProvider, signOut }),
    [user, signInWithProvider, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
