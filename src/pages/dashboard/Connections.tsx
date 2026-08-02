import { Link } from 'react-router-dom'
import { Check, X, Users } from 'lucide-react'
import { ME_ID } from '@/lib/profile-data'
import { useProfiles } from '@/lib/profiles-context'
import { Button, buttonVariants } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { LabelCaps } from '@/components/ui/label-caps'
import { cn } from '@/lib/utils'

// Founder ask (Telegram, 2026-08-02): the addressee of a connection request
// previously had no way to see or respond to one -- RLS already supported
// it (conn_select/conn_update, see 20260716120200_rls.sql), nothing in the
// app surfaced it. This page + profiles-context's incomingRequests/
// respondToRequest is that surface: accept -> connected, ignore -> the row
// is deleted so the same person can request again later (see
// respondToConnection's comment in api/profiles.ts for why not 'declined').
export function Connections() {
  const { profiles, incomingRequests, respondToRequest } = useProfiles()
  const connected = profiles.filter((p) => p.id !== ME_ID && p.connectStatus === 'connected')

  return (
    <div className="flex-1 w-full px-8 py-8 max-w-[720px] mx-auto">
      <LabelCaps className="block mb-1">Connections</LabelCaps>
      <p className="font-sans text-[0.8125rem] text-dark-muted mb-8">
        People who've asked to connect, and everyone you're already connected with.
      </p>

      <section className="mb-10">
        <h2 className="font-sans text-[0.875rem] font-semibold text-dark-text mb-3">
          Requests {incomingRequests.length > 0 && `(${incomingRequests.length})`}
        </h2>
        {incomingRequests.length === 0 ? (
          <p className="font-sans text-[0.8125rem] text-dark-muted">No pending requests.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {incomingRequests.map((r) => (
              <div
                key={r.id}
                className="bg-white/[0.03] border border-white/8 rounded-lg p-4 flex items-center gap-4"
              >
                <Link to={`/dashboard/profiles/${r.requesterId}`} className="flex items-center gap-4 flex-1 min-w-0">
                  <Avatar name={r.requesterName} src={r.requesterAvatarUrl} size="md" theme="dashboard" />
                  <div className="min-w-0">
                    <p className="font-sans text-[0.875rem] font-semibold text-dark-text truncate">{r.requesterName}</p>
                    <p className="font-sans text-[0.75rem] text-dark-muted">{r.requesterDiscipline}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button variant="accent" size="sm" onClick={() => respondToRequest(r.id, true)} className="gap-1.5">
                    <Check size={14} strokeWidth={2.2} />
                    Accept
                  </Button>
                  <Button variant="shell" size="sm" onClick={() => respondToRequest(r.id, false)} className="gap-1.5">
                    <X size={14} strokeWidth={2.2} />
                    Ignore
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-sans text-[0.875rem] font-semibold text-dark-text mb-3">
          Your connections {connected.length > 0 && `(${connected.length})`}
        </h2>
        {connected.length === 0 ? (
          <p className="font-sans text-[0.8125rem] text-dark-muted">
            Nobody yet — open a discipline group's Members tab to find people to connect with.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {connected.map((p) => (
              <Link
                key={p.id}
                to={`/dashboard/profiles/${p.id}`}
                className="bg-white/[0.03] border border-white/8 rounded-lg p-4 flex items-center gap-4 hover:border-white/20 hover:bg-white/[0.05] transition-colors duration-150"
              >
                <Avatar name={p.name} src={p.avatarUrl} size="md" theme="dashboard" />
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-[0.875rem] font-semibold text-dark-text truncate">{p.name}</p>
                  <div className="flex items-center gap-1.5 text-dark-muted mt-0.5">
                    <Users size={10} strokeWidth={1.8} />
                    <span className="font-sans text-[13px]">{p.discipline}</span>
                  </div>
                </div>
                <span className={cn(buttonVariants({ variant: 'done', size: 'sm' }), 'pointer-events-none flex-shrink-0')}>
                  <Check size={14} strokeWidth={2.2} />
                  Connected
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
