import { Home, Users, Briefcase, UserCircle, CalendarDays, MessageSquare, HelpCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export type DashboardSection = 'home' | 'community' | 'opportunities' | 'profiles' | 'calendar' | 'messages'

interface NavItem {
  id: DashboardSection
  label: string
  icon: typeof Home
}

// Community listed first among sections (after Home) — spec: highest-priority product surface.
const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'community', label: 'Community', icon: Users },
  { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
  { id: 'profiles', label: 'Profiles', icon: UserCircle },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
]

export function Sidebar({
  active,
  onSelect,
}: {
  active: DashboardSection
  onSelect: (section: DashboardSection) => void
}) {
  return (
    <aside className="w-[220px] flex-shrink-0 h-screen sticky top-0 flex flex-col border-r border-white/8 px-4 py-6">
      {/* Brand */}
      <Link to="/" className="flex items-center gap-2.5 px-2 mb-8 group">
        <span className="font-display text-white text-[1.125rem] font-bold tracking-[-0.03em] leading-none group-hover:text-white/70 transition-colors">
          ee
        </span>
        <span className="font-sans text-[9px] font-medium tracking-[0.22em] uppercase text-white/50 mt-px">
          engineer
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded font-sans text-[0.8125rem] font-medium transition-colors duration-150 ${
                isActive ? 'bg-white/8 text-white' : 'text-white/55 hover-white-tint hover:text-white/90'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={16} strokeWidth={1.8} />
              {item.label}
            </button>
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
  )
}
