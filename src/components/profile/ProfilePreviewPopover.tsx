import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { X, Code2, Link as LinkIcon, Users, MessageSquare } from 'lucide-react'
import { useProfiles } from '@/lib/profiles-context'
import { Avatar } from '@/components/ui/avatar'
import { Chip } from '@/components/ui/chip'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Compact profile preview for hover/click contexts (DM header, message
// avatars) where jumping straight to the full profile page would lose the
// surrounding context. Reuses the same profile store/components as
// ProfileDetail — no separate mini-profile data shape.
export function ProfilePreviewPopover({
  profileId,
  onClose,
  className,
  fixedPosition,
}: {
  profileId: string
  onClose: () => void
  /** Positioned relative to a `relative` ancestor (default). */
  className?: string
  /** Positioned via a document.body portal at these viewport coordinates —
   *  use this instead of `className` when the trigger sits inside an
   *  `overflow-y-auto` list: that CSS combination clips overflow-x too, so a
   *  regular absolutely-positioned popover gets cut off at the list edge. */
  fixedPosition?: { top: number; left: number }
}) {
  const { getProfile, toggleConnect } = useProfiles()
  const profile = getProfile(profileId)

  if (!profile) return null

  const content = (
    <div
      style={fixedPosition ? { position: 'fixed', top: fixedPosition.top, left: fixedPosition.left } : undefined}
      className={cn(
        fixedPosition ? 'z-40 w-[300px]' : 'absolute z-40 top-full mt-2 w-[300px]',
        'bg-dark-100 border border-white/12 rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.5)] p-5',
        className
      )}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors"
      >
        <X size={16} strokeWidth={1.8} />
      </button>

      <div className="flex items-start gap-3 mb-3">
        <Avatar name={profile.name} src={profile.avatarUrl} theme="dashboard" size="md" />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-display text-[0.9375rem] font-bold text-dark-text leading-tight">{profile.name}</span>
            <span className="inline-flex items-center rounded px-1 py-0.5 bg-gold-dark/15 border border-gold-dark/30 text-gold-dark font-sans text-[9px] font-semibold uppercase tracking-wide">
              Builder
            </span>
          </div>
          <div className="mt-1">
            <Chip theme="dashboard" discipline={profile.discipline}>{profile.discipline}</Chip>
          </div>
        </div>
      </div>

      {(profile.githubUrl || profile.linkedinUrl) && (
        <div className="flex items-center gap-3 mb-2.5">
          {profile.githubUrl && (
            <a
              href={profile.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-sans text-[11px] text-dark-muted hover:text-dark-text transition-colors"
            >
              <Code2 size={12} strokeWidth={1.8} />
              GitHub
            </a>
          )}
          {profile.linkedinUrl && (
            <a
              href={profile.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-sans text-[11px] text-dark-muted hover:text-dark-text transition-colors"
            >
              <LinkIcon size={12} strokeWidth={1.8} />
              LinkedIn
            </a>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 text-dark-muted mb-4">
        <Users size={11} strokeWidth={1.8} />
        <span className="font-sans text-[11px]">{profile.mutuals} mutual connections</span>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-white/8">
        <Link
          to={`/dashboard/profiles/${profile.id}`}
          className="flex-1 text-center font-sans text-[12px] font-medium text-white/70 hover:text-white/95 hover-white-tint rounded px-3 py-2 transition-colors"
        >
          View full profile
        </Link>
        {profile.connectStatus === 'connected' ? (
          // Already connected — the relevant action is messaging, not
          // re-displaying "Connected" as a dead-end achievement badge here.
          <Link to="/dashboard/messages" className={cn(buttonVariants({ variant: 'accent', size: 'sm' }))}>
            <MessageSquare size={13} strokeWidth={2} />
            Message
          </Link>
        ) : (
          <Button
            variant={profile.connectStatus === 'requested' ? 'shell' : 'accent'}
            size="sm"
            onClick={() => toggleConnect(profile.id)}
          >
            {profile.connectStatus === 'requested' ? 'Requested' : 'Connect'}
          </Button>
        )}
      </div>
    </div>
  )

  return fixedPosition ? createPortal(content, document.body) : content
}
