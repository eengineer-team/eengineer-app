import { Outlet } from 'react-router-dom'

// ProfilesProvider now lives at the Dashboard route level (App.tsx) so
// non-/profiles screens — e.g. the DM profile preview popover — can read
// the same in-memory profile store. This layout is just a routing stub now.
export function ProfilesLayout() {
  return <Outlet />
}
