import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth, firstNameOf } from '@/lib/auth-context'
import { DashboardBoot } from '@/components/DashboardBoot'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'

function displayName(user: NonNullable<ReturnType<typeof useAuth>['user']>) {
  return user.status === 'builder' ? firstNameOf(user.name) : 'Preview'
}

export function Dashboard() {
  const { user, loading } = useAuth()
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
  if (!minElapsed) return <DashboardBoot />   // logged-in: hold the intro a beat before revealing

  return (
    <div className="min-h-screen bg-dark-radial flex">
      <Sidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader name={displayName(user)} onMenuClick={() => setMobileNavOpen(true)} />
        <Outlet />
      </div>
    </div>
  )
}
