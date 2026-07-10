import { Link } from 'react-router-dom'
import { Users, Rocket } from 'lucide-react'
import { useProjects } from '@/lib/projects-context'
import { useProfiles } from '@/lib/profiles-context'
import { ME_ID } from '@/lib/profile-data'
import { Avatar } from '@/components/ui/avatar'
import { Chip } from '@/components/ui/chip'
import { Button } from '@/components/ui/button'

export function ProjectsHub() {
  const { projects } = useProjects()
  const { getProfile } = useProfiles()

  const myProject = projects.find((p) => p.ownerId === ME_ID)
  const hasMyProject = !!myProject?.name.trim()

  // Only real, filled-in projects show up for others to browse — an empty
  // seed row (like the signed-in Builder's own project before they've named
  // it) isn't something to show in a feed, same reasoning as PeerActivity's
  // "nothing posted yet" gate.
  const otherProjects = projects.filter((p) => p.ownerId !== ME_ID && p.name.trim())

  return (
    <div className="flex-1 px-4 md:px-8 py-6 md:py-8 max-w-[1180px]">
      <div className="flex items-center justify-between gap-4 mb-1">
        <h1 className="font-display text-xl font-semibold text-dark-text">Projects</h1>
        <Button variant={hasMyProject ? 'shell' : 'accent'} size="sm" asChild>
          <Link to="/dashboard/projects/mine">
            <Rocket size={14} strokeWidth={2} />
            {hasMyProject ? 'My Project' : 'Create your project'}
          </Link>
        </Button>
      </div>
      <p className="font-sans text-[0.8125rem] text-dark-muted mb-6">
        Post your own project to build a following and get feedback, or browse what other Builders are working on.
      </p>

      {!hasMyProject && (
        <div className="flex items-center justify-between gap-4 bg-white/[0.03] border border-dashed border-white/15 rounded-lg p-4 mb-6">
          <div>
            <div className="font-sans text-[0.875rem] font-semibold text-dark-text mb-0.5">
              You haven't added a project yet
            </div>
            <p className="font-sans text-[0.8125rem] text-dark-muted">
              Give it a name and description — you can fill in the rest later.
            </p>
          </div>
          <Button variant="accent" size="sm" asChild className="flex-shrink-0">
            <Link to="/dashboard/projects/mine">Get started</Link>
          </Button>
        </div>
      )}

      {otherProjects.length === 0 ? (
        <p className="font-sans text-[0.8125rem] text-dark-muted">
          No projects posted yet — be the first.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {otherProjects.map((project) => {
            const owner = getProfile(project.ownerId)
            if (!owner) return null
            return (
              <Link
                key={project.id}
                to={`/dashboard/projects/${project.id}`}
                className="flex flex-col bg-white/[0.03] border border-white/8 rounded-lg overflow-hidden hover:border-white/20 hover:bg-white/[0.05] transition-colors duration-150"
              >
                <div
                  className="h-20 bg-gradient-to-br from-white/8 to-transparent bg-cover bg-center flex-shrink-0"
                  style={project.coverUrl ? { backgroundImage: `url(${project.coverUrl})` } : undefined}
                />
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar name={project.name} src={project.thumbnailUrl} theme="dashboard" size="sm" />
                    <h3 className="flex-1 min-w-0 font-sans text-[0.9375rem] font-semibold text-dark-text truncate">
                      {project.name}
                    </h3>
                  </div>
                  <p className="font-sans text-[0.8125rem] text-dark-muted leading-snug line-clamp-2 mb-3 flex-1">
                    {project.description || 'No description yet.'}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Chip theme="dashboard" discipline={owner.discipline}>{owner.discipline}</Chip>
                      <span className="font-sans text-[11px] text-dark-muted truncate">{owner.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-dark-muted flex-shrink-0">
                      <Users size={11} strokeWidth={1.8} />
                      <span className="font-sans text-[11px]">{project.followerIds.length}</span>
                    </div>
                  </div>
                  {project.openToRecruitment && (
                    <span className="inline-flex items-center self-start mt-2.5 rounded px-1.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-sans text-[10px] font-semibold uppercase tracking-wide">
                      Open to team recruitment
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
