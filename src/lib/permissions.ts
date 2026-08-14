import type { AuthUser, Role } from '@/lib/auth-context'

// Centralized access control. Every route/component that needs to gate on
// who-can-do-what should call can(user, action) instead of checking
// user.status / user.role inline — see Sidebar/App/Community for the call
// sites this replaced (git blame "step A" commit for the old inline shape).

export type Action =
  | 'dashboard:home:view'
  | 'community:read-overview' // public Q&A feed, read-only — the one thing preview gets inside Community
  | 'community:vote'
  | 'community:comment'
  | 'community:report'
  | 'community:post-question'
  | 'community:webinars:view'
  | 'community:webinars:manage' // Community Lead: schedule/announce, no "run session" UI
  | 'community:network:view'
  | 'community:network:connect'
  | 'community:networking:view'
  | 'community:networking:post'
  | 'community:discussion:view'
  | 'community:discussion:post'
  | 'contests:view'
  | 'opportunities:view'
  | 'projects:view'
  | 'profiles:view'
  | 'calendar:view'
  | 'messages:view'
  | 'moderation:queue:view' // community-lead/admin/super-admin — mirrors reports SELECT RLS
  | 'moderation:content:remove' // community-lead/admin/super-admin — mirrors intro/disc staff DELETE + reports UPDATE RLS
  | 'moderation:users:view' // admin/super-admin only — mirrors user_roles SELECT RLS
  | 'roles:assign' // Super Admin only — never self-assign, never requestable via UI

// Everything a verified Builder can do, regardless of any extra role on top.
const BUILDER_ACTIONS: Action[] = [
  'dashboard:home:view',
  'community:read-overview',
  'community:vote',
  'community:comment',
  'community:report',
  'community:post-question',
  'community:webinars:view',
  'community:network:view',
  'community:network:connect',
  'community:networking:view',
  'community:networking:post',
  'community:discussion:view',
  'community:discussion:post',
  'contests:view',
  'opportunities:view',
  'projects:view',
  'profiles:view',
  'calendar:view',
  'messages:view',
]

const ROLE_ACTIONS: Record<Role, Action[]> = {
  builder: BUILDER_ACTIONS,
  'community-lead': [...BUILDER_ACTIONS, 'community:webinars:manage', 'moderation:queue:view', 'moderation:content:remove'],
  admin: [
    ...BUILDER_ACTIONS,
    'community:webinars:manage',
    'moderation:queue:view',
    'moderation:content:remove',
    'moderation:users:view',
  ],
  'super-admin': [
    ...BUILDER_ACTIONS,
    'community:webinars:manage',
    'moderation:queue:view',
    'moderation:content:remove',
    'moderation:users:view',
    'roles:assign',
  ],
}

// Kept as a safety net, not as a product tier. Google sign-ins are full
// members now (see 20260814140000_open_member_access.sql) — nothing routes
// here deliberately. A session still lands on this list when it carries no
// role claim at all: the signup trigger hasn't committed yet, or the
// access-token hook is disabled. Read-only is the right shape for "we don't
// know who this is yet", so the list stays rather than being deleted.
const PREVIEW_ACTIONS: Action[] = ['community:read-overview', 'contests:view', 'opportunities:view']

export function can(user: AuthUser | null, action: Action): boolean {
  if (!user) return false
  if (user.status === 'preview') return PREVIEW_ACTIONS.includes(action)
  return ROLE_ACTIONS[user.role].includes(action)
}
