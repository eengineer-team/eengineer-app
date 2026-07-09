import { Link } from 'react-router-dom'
import { COMMUNITY_GROUPS } from '@/lib/community-groups'
import { DisciplineGroupCard } from '@/components/community/DisciplineGroupCard'
import { JOINED_CLUBS } from '@/lib/clubs-data'
import { useProfiles } from '@/lib/profiles-context'
import { Chip } from '@/components/ui/chip'

// "What are your peers doing?" — latest projects posted in disciplines the
// viewer has actually joined (per founder spec: "if and only if you joined
// the specific community"). Pulls straight from the shared profiles store so
// it's the same project data ProfileDetail/Profiles list already show.
function PeerActivity() {
  const { profiles } = useProfiles()
  const joinedDisciplines = new Set(JOINED_CLUBS.map((c) => c.name))

  const latestProjects = profiles
    .filter((p) => joinedDisciplines.has(p.discipline))
    .flatMap((p) => p.projects.map((project) => ({ project, author: p })))
    .sort((a, b) => b.project.year - a.project.year)
    .slice(0, 5)

  return (
    <div className="lg:w-[280px] flex-shrink-0">
      <h2 className="font-sans text-[0.9375rem] font-bold text-white/95 mb-1">
        What are your peers doing?
      </h2>
      <p className="font-sans text-[0.75rem] text-dark-muted mb-4">
        Latest projects from communities you've joined.
      </p>

      {latestProjects.length === 0 ? (
        <p className="font-sans text-[0.8125rem] text-white/40">
          Nothing posted yet in your joined communities.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {latestProjects.map(({ project, author }) => (
            <Link
              key={project.id}
              to={`/dashboard/profiles/${author.id}`}
              className="block bg-white/[0.03] border border-white/8 rounded-lg p-3.5 hover:border-white/20 hover:bg-white/[0.05] transition-colors duration-150"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-sans text-[0.8125rem] font-semibold text-white/90 leading-snug">
                  {project.title}
                </h3>
                <span className="font-sans text-[10px] text-white/35 flex-shrink-0">{project.year}</span>
              </div>
              <p className="font-sans text-[11px] text-dark-muted leading-snug mb-2 line-clamp-2">
                {project.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="font-sans text-[11px] text-white/50">{author.name}</span>
                <Chip theme="dashboard" discipline={author.discipline}>{author.discipline}</Chip>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function CommunityHub() {
  return (
    <div className="flex-1 px-8 py-8 max-w-[1180px]">
      <div className="flex flex-col lg:flex-row gap-10">
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-xl font-semibold text-white/95 mb-1">Community</h1>
          <p className="font-sans text-[0.8125rem] text-dark-muted mb-6">
            Pick a discipline to see its Q&amp;A, webinars, and members.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COMMUNITY_GROUPS.map((group) => (
              <DisciplineGroupCard key={group.discipline} group={group} />
            ))}
          </div>
        </div>

        <PeerActivity />
      </div>
    </div>
  )
}
