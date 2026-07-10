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
  | 'opportunities:view'
  | 'projects:view'
  | 'profiles:view'
  | 'calendar:view'
  | 'messages:view'
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
  'opportunities:view',
  'projects:view',
  'profiles:view',
  'calendar:view',
  'messages:view',
]

const ROLE_ACTIONS: Record<Role, Action[]> = {
  builder: BUILDER_ACTIONS,
  'community-lead': [...BUILDER_ACTIONS, 'community:webinars:manage'],
  admin: [...BUILDER_ACTIONS, 'community:webinars:manage'],
  'super-admin': [...BUILDER_ACTIONS, 'community:webinars:manage', 'roles:assign'],
}

// Google-preview is a stateless pseudo-status, not a role: no persistent
// state, no admin can ever grant it more than this fixed allowlist.
const PREVIEW_ACTIONS: Action[] = ['community:read-overview', 'opportunities:view']

export function can(user: AuthUser | null, action: Action): boolean {
  if (!user) return false
  if (user.status === 'preview') return PREVIEW_ACTIONS.includes(action)
  return ROLE_ACTIONS[user.role].includes(action)
}
