import { Navigate } from 'react-router-dom'
import { useProjects } from '@/lib/projects-context'
import { ME_PROJECT_ID } from '@/lib/projects-data'

// Resolves the stable "/dashboard/projects/mine" nav target to the signed-in
// Builder's real project id. Before the Supabase migration this route always
// redirected to a hardcoded mock id (ME_PROJECT_ID = 'proj-me') that existed
// as a seeded row in the old mock store — that redirect was never updated
// when projects-context switched to live data, so it pointed at an id that
// no longer exists in the database. getProject() would then find nothing and
// ProjectDetail bounced straight back to /dashboard/projects, which is why
// "Create your project" and "Get started" looked like dead buttons.
//
// api/projects.ts's fetchProjects() lazily creates a real `projects` row for
// every Builder on first read (ensureMyProject), so myProject.id becomes a
// real UUID as soon as that fetch resolves. Until then, myProject falls back
// to the EMPTY_MY_PROJECT placeholder (id === ME_PROJECT_ID) — render nothing
// rather than navigate to a placeholder id that was never a real row.
export function MyProjectRedirect() {
  const { myProject } = useProjects()
  if (myProject.id === ME_PROJECT_ID) return null
  return <Navigate to={`/dashboard/projects/${myProject.id}`} replace />
}
