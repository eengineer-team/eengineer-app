import { useEffect, useState } from 'react'
import { Home, Users, Briefcase, UserCircle, CalendarDays, MessageSquare, HelpCircle, Settings, LogOut, X, PanelLeftClose, PanelLeftOpen, Rocket, ShieldCheck, Trophy } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { can, type Action } from '@/lib/permissions'
import { Tooltip } from '@/components/ui/tooltip'
import { Wordmark } from '@/components/ui/wordmark'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
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
  // Just below Community per founder spec (Future of Eengineer.net doc, item 8).
  { to: '/dashboard/contests', label: 'Contests', icon: Trophy, action: 'contests:view' },
  { to: '/dashboard/projects', label: 'Projects', icon: Rocket, action: 'projects:view' },
  { to: '/dashboard/opportunities', label: 'Opportunities', icon: Briefcase, action: 'opportunities:view' },
  { to: '/dashboard/profiles', label: 'Profiles', icon: UserCircle, action: 'profiles:view' },
  { to: '/dashboard/calendar', label: 'Calendar', icon: CalendarDays, action: 'calendar:view' },
  { to: '/dashboard/messages', label: 'Messages', icon: MessageSquare, action: 'messages:view' },
  { to: '/dashboard/admin', label: 'Admin', icon: ShieldCheck, action: 'moderation:queue:view' },
]

const COLLAPSE_STORAGE_KEY = 'eengineer:sidebar-collapsed'

function readStoredCollapsed() {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === 'true'
}

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, signOut } = useAuth()
  const items = NAV_ITEMS.filter((item) => can(user, item.action))
  const [collapsed, setCollapsed] = useState(readStoredCollapsed)

  useEffect(() => {
    window.localStorage.setItem(COLLAPSE_STORAGE_KEY, String(collapsed))
  }, [collapsed])

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 px-3 py-2.5 rounded font-sans text-[0.875rem] font-medium transition-colors duration-150',
      collapsed && 'md:justify-center md:px-0',
      isActive ? 'bg-white/8 text-white' : 'text-dark-muted hover-white-tint hover:text-dark-text',
    )

  return (
    <>
      {/* Mobile backdrop — closes the drawer, no-op above md where the sidebar is static */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} aria-hidden="true" />
      )}

      <aside
        className={cn(
          'fixed md:sticky top-0 left-0 z-50 w-[220px] flex-shrink-0 h-screen flex flex-col border-r border-white/8 bg-dark-100 md:bg-transparent px-4 py-6 transition-[transform,width] duration-200 ease-in-out md:translate-x-0',
          collapsed ? 'md:w-16' : 'md:w-[220px]',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand + desktop collapse toggle share one row — no dead space above Home */}
        <div className={cn('flex items-center justify-between mb-6', collapsed && 'md:flex-col md:justify-center md:gap-2')}>
          <Link
            to="/dashboard"
            className={cn('flex items-center group', collapsed ? 'md:px-0' : 'px-2')}
          >
            <Wordmark
              variant="dark"
              size="sm"
              className="transition-opacity group-hover:opacity-70"
              tailClassName={collapsed ? 'md:hidden' : undefined}
            />
          </Link>

          {/* Desktop collapse toggle — persisted, does not affect mobile drawer */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden md:flex min-w-[40px] min-h-[40px] items-center justify-center text-dark-muted hover:text-dark-text hover-white-tint rounded transition-colors duration-150"
          >
            {collapsed ? <PanelLeftOpen size={16} strokeWidth={1.8} /> : <PanelLeftClose size={16} strokeWidth={1.8} />}
          </button>

          {/* Mobile-only close, independent of the desktop collapse toggle */}
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="md:hidden min-w-[40px] min-h-[40px] flex items-center justify-center text-white/70 hover:text-white hover-white-tint rounded transition-colors duration-150"
          >
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        {/* Nav fills the scrollable flex-1 area so the footer stays sticky. My Clubs
            was removed from here (duplicated the Home widget) — Joined Clubs lives
            only on DashboardHome now. */}
        <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
          <nav className="flex flex-col gap-1">
            {items.map((item) => {
              const Icon = item.icon
              return (
                <Tooltip key={item.to} label={item.label} disabled={!collapsed} className="md:block">
                  <NavLink to={item.to} end={item.end} onClick={onClose} className={navItemClass}>
                    <Icon size={19} strokeWidth={1.8} className="flex-shrink-0" />
                    <span className={collapsed ? 'md:hidden' : ''}>{item.label}</span>
                  </NavLink>
                </Tooltip>
              )
            })}
          </nav>
        </div>

        {/* Footer — single Settings entry. Folds in what used to be the top-right
            header menu (Help, Sign out) so there's one Settings surface instead
            of two competing ones. */}
        <div className="pt-4 border-t border-white/8 flex flex-col gap-1">
          <DropdownMenu>
            <Tooltip label="Settings" disabled={!collapsed} className="md:block">
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded font-sans text-[0.875rem] font-medium text-dark-muted hover-white-tint hover:text-dark-text transition-colors duration-150 w-full',
                    collapsed && 'md:justify-center md:px-0',
                  )}
                >
                  <Settings size={19} strokeWidth={1.8} className="flex-shrink-0" />
                  <span className={collapsed ? 'md:hidden' : ''}>Settings</span>
                </button>
              </DropdownMenuTrigger>
            </Tooltip>
            <DropdownMenuContent align="start" side="top">
              <DropdownMenuItem asChild>
                <NavLink to="/dashboard/settings" onClick={onClose} className="flex items-center gap-2.5">
                  <Settings size={14} strokeWidth={1.8} />
                  Settings
                </NavLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/help" onClick={onClose} className="flex items-center gap-2.5">
                  <HelpCircle size={14} strokeWidth={1.8} />
                  Help
                </Link>
              </DropdownMenuItem>
              {user?.status === 'builder' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => {
                      onClose()
                      signOut()
                    }}
                    className="flex items-center gap-2.5"
                  >
                    <LogOut size={14} strokeWidth={1.8} />
                    Sign out
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  )
}
