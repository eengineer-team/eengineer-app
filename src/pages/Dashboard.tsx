import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'

function displayName(user: NonNullable<ReturnType<typeof useAuth>['user']>) {
  return user.status === 'builder' ? user.name : 'Preview'
}

export function Dashboard() {
  const { user } = useAuth()

  if (!user) return <Navigate to="/auth" replace />

  return (
    <div className="min-h-screen bg-dark-radial flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader name={displayName(user)} />
        <Outlet />
      </div>
    </div>
  )
}
