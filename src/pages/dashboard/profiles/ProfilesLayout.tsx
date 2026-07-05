import { Outlet } from 'react-router-dom'
import { ProfilesProvider } from '@/lib/profiles-context'

// Route-level provider so the list and detail pages share one in-memory
// profile store without prop-drilling through the router.
export function ProfilesLayout() {
  return (
    <ProfilesProvider>
      <Outlet />
    </ProfilesProvider>
  )
}
