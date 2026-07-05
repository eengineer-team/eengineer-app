import { Home, Users, Briefcase, UserCircle, CalendarDays, MessageSquare, HelpCircle, X } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { can, type Action } from '@/lib/permissions'

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

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1">
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
