import * as React from 'react'
import { Users, Check, X } from 'lucide-react'
import { SEED_NETWORK, type Discipline, type NetworkProfile } from '@/lib/community-data'
import { Button, buttonVariants } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { LabelCaps } from '@/components/ui/label-caps'
import { cn } from '@/lib/utils'

function ProfileCard({
  profile,
  onConnect,
  onAccept,
  onDecline,
}: {
  profile: NetworkProfile
  onConnect: (id: string) => void
  onAccept: (id: string) => void
  onDecline: (id: string) => void
}) {
  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-lg p-4 flex items-center gap-4">
      <Avatar name={profile.name} size="md" theme="dashboard" />

      <div className="flex-1 min-w-0">
        <div className="font-sans text-[0.875rem] font-semibold text-dark-text leading-tight">
          {profile.name}
        </div>
        <div className="font-sans text-[0.75rem] text-dark-muted mt-0.5">{profile.discipline}</div>
        <div className="flex items-center gap-1.5 text-dark-muted mt-1">
          <Users size={10} strokeWidth={1.8} />
          <span className="font-sans text-[11px]">{profile.mutuals} mutual connections</span>
        </div>
      </div>

      <div className="flex-shrink-0">
        {profile.status === 'none' && (
          <Button variant="accent" size="sm" onClick={() => onConnect(profile.id)}>
            Connect
          </Button>
        )}
        {profile.status === 'requested' && (
          <Button variant="shell" size="sm" onClick={() => onConnect(profile.id)}>
            Requested
          </Button>
        )}
        {/* Not a real disabled state — connected is a reached achievement, not a
            blocked action, so this skips Button's disabled:opacity-40 styling. */}
        {profile.status === 'connected' && (
          <span className={cn(buttonVariants({ variant: 'done', size: 'sm' }), 'pointer-events-none')}>
            <Check size={14} strokeWidth={2.2} />
            Connected
          </span>
        )}
        {profile.status === 'incoming' && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onAccept(profile.id)}
              aria-label={`Accept ${profile.name}`}
              className="w-8 h-8 flex items-center justify-center rounded bg-corn-700 text-white hover:bg-corn-600 transition-colors"
            >
              <Check size={14} strokeWidth={2.2} />
            </button>
            <button
              onClick={() => onDecline(profile.id)}
              aria-label={`Decline ${profile.name}`}
              className="w-8 h-8 flex items-center justify-center rounded hover-white-tint text-white/60 hover:text-dark-text transition-colors"
            >
              <X size={14} strokeWidth={2.2} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// `discipline` scopes the list to one group's members (Community hub → group
// space, label "Members"); omit for the global "My Network" view.
export function Network({ discipline }: { discipline?: Discipline } = {}) {
  const [profiles, setProfiles] = React.useState<NetworkProfile[]>(SEED_NETWORK)

  function setStatus(id: string, status: NetworkProfile['status']) {
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)))
  }

  function handleConnect(id: string) {
    const p = profiles.find((x) => x.id === id)
    setStatus(id, p?.status === 'requested' ? 'none' : 'requested')
  }

  const scoped = discipline ? profiles.filter((p) => p.discipline === discipline) : profiles
  const incoming = scoped.filter((p) => p.status === 'incoming')
  const rest = scoped.filter((p) => p.status !== 'incoming')

  return (
    <div className="flex flex-col gap-8">
      {incoming.length > 0 && (
        <div>
          <LabelCaps className="block mb-3">Connection requests</LabelCaps>
          <div className="flex flex-col gap-3">
            {incoming.map((p) => (
              <ProfileCard
                key={p.id}
                profile={p}
                onConnect={handleConnect}
                onAccept={(id) => setStatus(id, 'connected')}
                onDecline={(id) => setStatus(id, 'none')}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <LabelCaps className="block mb-3">{discipline ? 'Members' : 'My Network'}</LabelCaps>
        {rest.length === 0 ? (
          <p className="font-sans text-[0.8125rem] text-dark-muted">
            {discipline ? `No members in ${discipline} yet.` : 'No connections yet.'}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {rest.map((p) => (
              <ProfileCard
                key={p.id}
                profile={p}
                onConnect={handleConnect}
                onAccept={(id) => setStatus(id, 'connected')}
                onDecline={(id) => setStatus(id, 'none')}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
