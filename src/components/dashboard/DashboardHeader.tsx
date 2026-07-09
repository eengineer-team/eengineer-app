import { Bell, MessageSquare, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SettingsMenu } from '@/components/SettingsMenu'
import { useAuth } from '@/lib/auth-context'
import { can } from '@/lib/permissions'
import { useMessages } from '@/lib/messages-context'
import { SEED_COMPETITIONS } from '@/lib/calendar-data'

function IconBadge({
  icon: Icon,
  count,
  label,
  onClick,
}: {
  icon: typeof Bell
  count: number
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="relative w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover-white-tint rounded transition-colors duration-150"
      aria-label={count > 0 ? `${label}: ${count} unread` : label}
    >
      <Icon size={16} strokeWidth={1.8} />
      {count > 0 && (
        <span className="absolute top-1 right-1 w-[7px] h-[7px] rounded-full bg-corn-700" />
      )}
    </button>
  )
}

export function DashboardHeader({ name, onMenuClick }: { name: string; onMenuClick: () => void }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { unreadTotal } = useMessages()
  // Google preview can't reach Messages or Calendar (see permissions.ts) — hide
  // both badges for it instead of showing a count that just bounces to /auth.
  const canSeeBadges = can(user, 'messages:view')
  // "Notifications" bell doubles as the real deadline-reminder feed from the
  // Calendar (see CompetitionCalendar's Daily Reminders) rather than an
  // invented, never-clearing number — there's no separate notifications
  // system in the app yet, so this is the one real source of "things to know."
  const reminderCount = SEED_COMPETITIONS.length

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 py-5 border-b border-white/8 bg-dark-100/90 backdrop-blur-sm">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="md:hidden w-8 h-8 flex-shrink-0 flex items-center justify-center text-white/70 hover:text-white hover-white-tint rounded transition-colors duration-150"
        >
          <Menu size={18} strokeWidth={1.8} />
        </button>
        <span className="font-display text-white text-[1.25rem] font-bold tracking-[-0.02em] truncate">
          Hello, {name}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {canSeeBadges && (
          <>
            <IconBadge
              icon={MessageSquare}
              count={unreadTotal}
              label="Messages"
              onClick={() => navigate('/dashboard/messages')}
            />
            <IconBadge
              icon={Bell}
              count={reminderCount}
              label="Upcoming deadlines"
              onClick={() => navigate('/dashboard/calendar')}
            />
          </>
        )}
        <SettingsMenu variant="dark" />
      </div>
    </header>
  )
}
