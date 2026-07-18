import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { useProfiles } from '@/lib/profiles-context'
import { ME_ID } from '@/lib/profile-data'
import { Avatar } from '@/components/ui/avatar'
import { Chip } from '@/components/ui/chip'
import { LabelCaps } from '@/components/ui/label-caps'

function displayName(user: ReturnType<typeof useAuth>['user'], name: string) {
  return name === 'You' && user?.status === 'builder' ? user.name : name
}

// Profiles are public per spec: any signed-in user (Builder or Google
// preview) can browse anyone's skills/projects/activity, not just their own.
export function ProfilesList() {
  const { user } = useAuth()
  const { profiles } = useProfiles()

  return (
    <div className="flex-1 px-8 py-8 max-w-[880px]">
      <h1 className="font-display text-xl font-semibold text-dark-text mb-1">Profiles</h1>
      <p className="font-sans text-[0.8125rem] text-dark-muted mb-6">
        Every Builder's skills, projects, and endorsements — public to the network.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((p) => {
          const name = displayName(user, p.name)
          return (
            <Link
              key={p.id}
              // Your own card goes to Settings — that's where profile editing
              // lives now, not a "make your own account" flow inside Profiles
              // (see ProfileDetail.tsx, which redirects the same way for a
              // direct visit to /dashboard/profiles/{ME_ID}).
              to={p.id === ME_ID ? '/dashboard/settings' : `/dashboard/profiles/${p.id}`}
              className="bg-white/[0.03] border border-white/8 rounded-lg p-5 hover:border-white/20 hover:bg-white/[0.05] transition-colors duration-150"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="relative flex-shrink-0">
                  <Avatar name={name} src={p.avatarUrl} theme="dashboard" size="md" />
                  {p.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-dark-100" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-sans text-[0.875rem] font-semibold text-dark-text leading-tight truncate">
                    {name}
                    {p.id === ME_ID && <span className="text-dark-muted font-normal"> (you)</span>}
                  </div>
                  <LabelCaps className="mt-0.5">Builder</LabelCaps>
                </div>
              </div>

              <p className="font-sans text-[0.8125rem] text-white/60 leading-snug mb-3 line-clamp-2">{p.bio}</p>

              <div className="flex items-center gap-1.5 flex-wrap">
                <Chip theme="dashboard" discipline={p.discipline}>{p.discipline}</Chip>
                {p.skills.slice(0, 2).map((s) => (
                  <Chip key={s.name} theme="dashboard">
                    {s.name}
                  </Chip>
                ))}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
