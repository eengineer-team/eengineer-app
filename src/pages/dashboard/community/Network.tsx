import { Link } from 'react-router-dom'
import { Users, Check } from 'lucide-react'
import type { Discipline } from '@/lib/community-data'
import { ME_ID, type BuilderProfile } from '@/lib/profile-data'
import { useProfiles } from '@/lib/profiles-context'
import { Button, buttonVariants } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { LabelCaps } from '@/components/ui/label-caps'
import { cn } from '@/lib/utils'

function ProfileCard({ profile, onConnect }: { profile: BuilderProfile; onConnect: (id: string) => void }) {
  return (
    <Link
      to={`/dashboard/profiles/${profile.id}`}
      className="bg-white/[0.03] border border-white/8 rounded-lg p-4 flex items-center gap-4 hover:border-white/20 hover:bg-white/[0.05] transition-colors duration-150"
    >
      <Avatar name={profile.name} src={profile.avatarUrl} size="md" theme="dashboard" />

      <div className="flex-1 min-w-0">
        <div className="font-sans text-[0.875rem] font-semibold text-dark-text leading-tight">
          {profile.name}
        </div>
        <div className="font-sans text-[0.75rem] text-dark-muted mt-0.5">{profile.discipline}</div>
        <div className="flex items-center gap-1.5 text-dark-muted mt-1">
          <Users size={10} strokeWidth={1.8} />
          <span className="font-sans text-[13px]">{profile.mutuals} mutual connections</span>
        </div>
      </div>

      <div className="flex-shrink-0">
        {profile.connectStatus === 'connected' ? (
          // Reached achievement, not a blocked action — skip Button's
          // disabled:opacity-40 styling (same pattern as ProfileDetail.tsx).
          <span className={cn(buttonVariants({ variant: 'done', size: 'sm' }), 'pointer-events-none')}>
            <Check size={14} strokeWidth={2.2} />
            Connected
          </span>
        ) : (
          <Button
            variant={profile.connectStatus === 'requested' ? 'shell' : 'accent'}
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              onConnect(profile.id)
            }}
          >
            {profile.connectStatus === 'requested' ? 'Requested' : 'Connect'}
          </Button>
        )}
      </div>
    </Link>
  )
}

// `discipline` scopes the list to one group's members (Community hub → group
// space, label "Members"); omit for the global "My Network" view. Backed by
// the same live profiles-context every other profile surface reads — no
// separate fetch, no seed data. profiles SELECT is app.is_builder(), so
// preview users correctly see nothing here.
export function Network({ discipline }: { discipline?: Discipline } = {}) {
  const { profiles, toggleConnect } = useProfiles()

  const scoped = profiles.filter((p) => p.id !== ME_ID && (!discipline || p.discipline === discipline))

  return (
    <div className="flex flex-col gap-8">
      <div>
        <LabelCaps className="block mb-3">{discipline ? 'Members' : 'My Network'}</LabelCaps>
        {scoped.length === 0 ? (
          <p className="font-sans text-[0.8125rem] text-dark-muted">
            {discipline ? `No members in ${discipline} yet.` : 'No connections yet.'}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {scoped.map((p) => (
              <ProfileCard key={p.id} profile={p} onConnect={toggleConnect} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
