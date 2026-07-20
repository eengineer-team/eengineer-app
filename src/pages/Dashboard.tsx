import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth, firstNameOf } from '@/lib/auth-context'
import { useProfiles } from '@/lib/profiles-context'
import { ME_ID } from '@/lib/profile-data'
import { DashboardBoot } from '@/components/DashboardBoot'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary'

function displayName(user: NonNullable<ReturnType<typeof useAuth>['user']>) {
  return user.status === 'builder' ? firstNameOf(user.name) : 'Preview'
}

export function Dashboard() {
  const { user, loading } = useAuth()
  const { getProfile, loading: profilesLoading } = useProfiles()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // Deliberate brand intro: hold the boot preview for a minimum beat so it plays
  // as an intentional "preview before the dashboard", not just while the session
  // happens to be loading. (Tune BOOT_MS, or gate on sessionStorage to play once
  // per tab if it ever feels repetitive.)
  const [minElapsed, setMinElapsed] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), 2200)
    return () => clearTimeout(t)
  }, [])

  if (loading) return <DashboardBoot />
  if (!user) return <Navigate to="/auth" replace />

  // Age gate, enforced at the route rather than inside Onboarding's UI. The
  // date of birth is legally required before a Builder uses the product, and
  // /dashboard is a plain URL anyone can type — enforcing it only on the
  // onboarding screen meant it could be skipped by never visiting that screen.
  // Preview users have no profile row and are not subject to this.
  if (user.status === 'builder') {
    if (profilesLoading) return <DashboardBoot />
    const me = getProfile(ME_ID)
    // Only redirect once we've actually loaded a profile and it has no
    // birthdate — a failed fetch must not bounce people into onboarding.
    if (me && !me.birthdate) return <Navigate to="/onboarding" replace />
  }

  if (!minElapsed) return <DashboardBoot />   // logged-in: hold the intro a beat before revealing

  return (
    <div className="min-h-screen bg-dark-radial flex">
      <Sidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader name={displayName(user)} onMenuClick={() => setMobileNavOpen(true)} />
        <DashboardErrorBoundary>
          <Outlet />
        </DashboardErrorBoundary>
      </div>
    </div>
  )
}
