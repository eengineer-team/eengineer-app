import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { formatRelativeTime } from '@/lib/api/community'
import { useNotifications } from '@/lib/notifications-context'

// Distinct from the existing deadline-reminder bell in DashboardHeader --
// this is the real per-user notifications feed (currently just "new webinar
// in your discipline"), backed by the notifications table + a DB trigger on
// webinar creation, not a derived/borrowed count from another feature.
export function NotificationsBell() {
  const navigate = useNavigate()
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()

  function handleSelect(id: string, link: string | null) {
    markRead(id)
    if (link) navigate(link)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative min-w-[40px] min-h-[40px] flex items-center justify-center text-white/70 hover:text-white hover-white-tint rounded transition-colors duration-150"
          aria-label={unreadCount > 0 ? `Notifications: ${unreadCount} unread` : 'Notifications'}
        >
          <Bell size={16} strokeWidth={1.8} />
          {unreadCount > 0 && (
            <span className="absolute top-2.5 right-2.5 w-[7px] h-[7px] rounded-full bg-corn-700" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[320px] max-h-[420px] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-2">
          <span className="font-sans text-[12px] font-semibold uppercase tracking-wide text-corn-300">
            Notifications
          </span>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="font-sans text-[11px] font-medium text-corn-400 hover:text-corn-100 transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-4 py-4 font-sans text-[13px] text-corn-400">Nothing yet.</p>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem
              key={n.id}
              onSelect={() => handleSelect(n.id, n.link)}
              className="flex-col items-start gap-0.5 py-3"
            >
              <div className="flex items-center gap-1.5 w-full">
                {!n.read && <span className="w-[6px] h-[6px] rounded-full bg-corn-700 flex-shrink-0" />}
                <span className="font-sans text-[13px] font-semibold text-corn-100 truncate">{n.title}</span>
              </div>
              <span className="font-sans text-[12px] text-corn-400 leading-snug">{n.body}</span>
              <span className="font-sans text-[11px] text-corn-500">{formatRelativeTime(n.createdAt)}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
