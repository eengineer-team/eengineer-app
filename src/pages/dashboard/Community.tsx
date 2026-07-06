import { Outlet } from 'react-router-dom'

// Entry point for Community is the discipline hub (CommunityHub, index route);
// clicking a group navigates to CommunityGroup at :discipline. This layout
// just hosts the nested routes — see App.tsx.
export function Community() {
  return <Outlet />
}
