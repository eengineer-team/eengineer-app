import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { can, type Action } from '@/lib/permissions'

// Route-level guard: renders children only if the current user can(action).
// Otherwise redirects to /auth with an upgrade prompt (see Auth.tsx).
export function RequireAction({ action, children }: { action: Action; children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null            // don't judge permissions until the session has loaded
  if (!can(user, action)) {
    return <Navigate to="/auth" state={{ upgrade: true, from: location.pathname }} replace />
  }

  return <>{children}</>
}
