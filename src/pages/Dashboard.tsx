import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth, firstNameOf } from '@/lib/auth-context'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'

function displayName(user: NonNullable<ReturnType<typeof useAuth>['user']>) {
  return user.status === 'builder' ? firstNameOf(user.name) : 'Preview'
}

export function Dashboard() {
  const { user } = useAuth()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  if (!user) return <Navigate to="/auth" replace />

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
