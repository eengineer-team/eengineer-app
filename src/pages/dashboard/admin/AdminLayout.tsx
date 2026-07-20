import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { can } from '@/lib/permissions'
import { cn } from '@/lib/utils'

// Tabs are gated individually too (not just the outer route) — Users needs
// admin+, Roles needs super-admin, so a community-lead should never even see
// those tabs rendered, not see them and get bounced on click.
const TABS = [
  { to: '/dashboard/admin/reports', label: 'Reports', action: 'moderation:queue:view' as const },
  { to: '/dashboard/admin/content', label: 'Content', action: 'moderation:content:remove' as const },
  { to: '/dashboard/admin/users', label: 'Users', action: 'moderation:users:view' as const },
  { to: '/dashboard/admin/roles', label: 'Roles', action: 'roles:assign' as const },
]

export function AdminLayout() {
  const { user } = useAuth()
  const tabs = TABS.filter((t) => can(user, t.action))

  return (
    <div className="flex-1 w-full px-8 py-8 max-w-[960px] mx-auto">
      <h1 className="font-display text-xl font-semibold text-dark-text mb-1">Admin</h1>
      <p className="font-sans text-[0.8125rem] text-dark-muted mb-6">
        Moderation queue, community content, and role management.
      </p>

      <div className="flex items-center gap-1 border-b border-white/8 mb-6">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                'px-4 py-2.5 font-sans text-[0.8125rem] font-medium border-b-2 -mb-px transition-colors duration-150',
                isActive ? 'text-white border-gold-dark' : 'text-dark-muted border-transparent hover:text-dark-text'
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  )
}
