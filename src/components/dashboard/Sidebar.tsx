import { Home, Users, Briefcase, UserCircle, CalendarDays, MessageSquare, HelpCircle, X } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { can, type Action } from '@/lib/permissions'
import { JOINED_CLUBS } from '@/lib/clubs-data'
import { getDisciplineColor } from '@/lib/discipline-colors'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  end?: boolean
  label: string
  icon: typeof Home
  action: Action
}

// Community listed first among sections (after Home) — spec: highest-priority product surface.
const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', end: true, label: 'Home', icon: Home, action: 'dashboard:home:view' },
  { to: '/dashboard/community', label: 'Community', icon: Users, action: 'community:read-overview' },
  { to: '/dashboard/opportunities', label: 'Opportunities', icon: Briefcase, action: 'opportunities:view' },
  { to: '/dashboard/profiles', label: 'Profiles', icon: UserCircle, action: 'profiles:view' },
  { to: '/dashboard/calendar', label: 'Calendar', icon: CalendarDays, action: 'calendar:view' },
  { to: '/dashboard/messages', label: 'Messages', icon: MessageSquare, action: 'messages:view' },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth()
  const items = NAV_ITEMS.filter((item) => can(user, item.action))

  return (
    <>
      {/* Mobile backdrop — closes the drawer, no-op above md where the sidebar is static */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-50 w-[220px] flex-shrink-0 h-screen flex flex-col border-r border-white/8 bg-dark-100 md:bg-transparent px-4 py-6 transition-transform duration-200 md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2.5 px-2 group">
            <span className="font-display text-white text-[1.125rem] font-bold tracking-[-0.03em] leading-none group-hover:text-white/70 transition-colors">
              ee
            </span>
            <span className="font-sans text-[9px] font-medium tracking-[0.22em] uppercase text-white/50 mt-px">
              engineer
            </span>
          </Link>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="md:hidden w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover-white-tint rounded transition-colors duration-150"
          >
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        {/* Nav + My Clubs share the scrollable flex-1 area so the footer stays sticky */}
        <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
          <nav className="flex flex-col gap-1">
            {items.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded font-sans text-[0.8125rem] font-medium transition-colors duration-150 ${
                      isActive ? 'bg-white/8 text-white' : 'text-white/55 hover-white-tint hover:text-white/90'
                    }`
                  }
                >
                  <Icon size={16} strokeWidth={1.8} />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          {/* My Clubs — persistent, not just on the Home landing widget. Google-preview
              guests have no membership state, so this is Builder-only. */}
          {user?.status === 'builder' && (
            <div className="pt-4 mt-2 border-t border-white/8">
              <span className="font-sans text-[10px] font-medium tracking-[0.16em] uppercase text-white/45 px-3 block mb-2">
                My Clubs
              </span>
              <div className="flex flex-col gap-0.5">
                {JOINED_CLUBS.map((club) => (
                  <div
                    key={club.name}
                    className="flex items-center gap-2.5 px-3 py-2 rounded font-sans text-[0.8125rem] text-white/55 hover-white-tint hover:text-white/90 transition-colors duration-150"
                  >
                    <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', getDisciplineColor(club.name).dot)} />
                    <span className="flex-1 truncate">{club.name}</span>
                    {!!club.unreadCount && (
                      <span className="flex-shrink-0 min-w-[16px] h-4 px-1 rounded-full bg-gold-dark text-dark-900 font-sans text-[10px] font-semibold flex items-center justify-center">
                        {club.unreadCount}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer — Help only; Settings lives top-right per the resolved spec convention */}
        <div className="pt-4 border-t border-white/8">
          <Link
            to="/help"
            className="flex items-center gap-3 px-3 py-2.5 rounded font-sans text-[0.8125rem] font-medium text-white/55 hover-white-tint hover:text-white/90 transition-colors duration-150"
          >
            <HelpCircle size={16} strokeWidth={1.8} />
            Help
          </Link>
        </div>
      </aside>
    </>
  )
}
