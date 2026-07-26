import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/lib/auth-context'
import { ProfilesProvider } from '@/lib/profiles-context'
import { MessagesProvider } from '@/lib/messages-context'
import { ProjectsProvider } from '@/lib/projects-context'
import { CurrentActivityProvider } from '@/lib/current-activity-context'
import { WebinarsProvider } from '@/lib/webinars-context'
import { ClubsProvider } from '@/lib/clubs-context'
import { CompetitionsProvider } from '@/lib/competitions-context'
import { OpportunitiesProvider } from '@/lib/opportunities-context'
import { NotificationsProvider } from '@/lib/notifications-context'
import { CommunityStatsProvider } from '@/lib/community-stats-context'
import { Welcome } from '@/pages/Welcome'
import { Contest } from '@/pages/Contest'
import { Auth } from '@/pages/Auth'
import { Onboarding } from '@/pages/Onboarding'
import { Help } from '@/pages/Help'
import { Dashboard } from '@/pages/Dashboard'
import { DashboardHome } from '@/pages/dashboard/DashboardHome'
import { Community } from '@/pages/dashboard/Community'
import { CommunityHub } from '@/pages/dashboard/community/CommunityHub'
import { CommunityGroup } from '@/pages/dashboard/community/CommunityGroup'
import { ContestsHub } from '@/pages/dashboard/contests/ContestsHub'
import { ContestDetail } from '@/pages/dashboard/contests/ContestDetail'
import { Opportunities } from '@/pages/dashboard/Opportunities'
import { ProjectsHub } from '@/pages/dashboard/projects/ProjectsHub'
import { ProjectDetail } from '@/pages/dashboard/projects/ProjectDetail'
import { MyProjectRedirect } from '@/pages/dashboard/projects/MyProjectRedirect'
import { ProfilesLayout } from '@/pages/dashboard/profiles/ProfilesLayout'
import { ProfilesList } from '@/pages/dashboard/profiles/ProfilesList'
import { ProfileDetail } from '@/pages/dashboard/profiles/ProfileDetail'
import { Calendar } from '@/pages/dashboard/Calendar'
import { CompetitionDetail } from '@/pages/dashboard/CompetitionDetail'
import { OpportunityDetail } from '@/pages/dashboard/OpportunityDetail'
import { Messages } from '@/pages/dashboard/Messages'
import { SettingsPage } from '@/pages/dashboard/Settings'
import { Terms } from '@/pages/legal/Terms'
import { Privacy } from '@/pages/legal/Privacy'
import { RequireAction } from '@/components/dashboard/RequireAction'
import { AdminLayout } from '@/pages/dashboard/admin/AdminLayout'
import { AdminReports } from '@/pages/dashboard/admin/AdminReports'
import { AdminContent } from '@/pages/dashboard/admin/AdminContent'
import { AdminUsers } from '@/pages/dashboard/admin/AdminUsers'
import { AdminRoles } from '@/pages/dashboard/admin/AdminRoles'
import { InternalLogin } from '@/pages/internal/InternalLogin'
import { InternalLayout } from '@/pages/internal/InternalLayout'
import { InternalWaitlist } from '@/pages/internal/InternalWaitlist'
import { InternalFeedback } from '@/pages/internal/InternalFeedback'
import { InternalCompetitions } from '@/pages/internal/InternalCompetitions'
import { InternalContest } from '@/pages/internal/InternalContest'
import './index.css'

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AuthProvider>
        {/* Profiles state lives above /onboarding and /dashboard both — onboarding
            writes the ME profile via the same context the dashboard reads from,
            not a separate draft that would need merging in later. */}
        <ProfilesProvider>
          {/* Messages state lives above /dashboard too — the header's unread
              badge and the Messages page itself need to read/write the same
              conversation state, not two independently-reset copies. */}
          <MessagesProvider>
          <ProjectsProvider>
          <CurrentActivityProvider>
          <WebinarsProvider>
          <ClubsProvider>
          <CompetitionsProvider>
          <OpportunitiesProvider>
          <NotificationsProvider>
          <CommunityStatsProvider>
          <BrowserRouter>
            <Routes>
              {/* Waitlist interstitial (2026-07) was removed from the launch
                  flow -- founder decision once the site was ready for the
                  real public launch. Collected signups (waitlist_signups)
                  are untouched; Waitlist.tsx is just unrouted, not deleted,
                  in case it's ever needed again. "/" and "/home" both render
                  the real marketing landing now. */}
              <Route path="/"     element={<Welcome />} />
              <Route path="/home" element={<Welcome />} />
              {/* Public and ungated on purpose — a visitor can read the whole
                  contest before deciding to make an account. The gated
                  version lives at /dashboard/contests for signed-in Builders
                  (submitting, voting, leaderboard); this is the shop window. */}
              <Route path="/contest" element={<Contest />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/help" element={<Help />} />
              <Route path="/dashboard" element={<Dashboard />}>
                <Route
                  index
                  element={<RequireAction action="dashboard:home:view"><DashboardHome /></RequireAction>}
                />
                <Route path="community" element={<Community />}>
                  <Route index element={<CommunityHub />} />
                  <Route path=":discipline" element={<CommunityGroup />} />
                </Route>
                <Route
                  path="contests"
                  element={<RequireAction action="contests:view"><ContestsHub /></RequireAction>}
                />
                <Route
                  path="contests/:id"
                  element={<RequireAction action="contests:view"><ContestDetail /></RequireAction>}
                />
                <Route
                  path="opportunities"
                  element={<RequireAction action="opportunities:view"><Opportunities /></RequireAction>}
                />
                <Route
                  path="opportunities/:id"
                  element={<RequireAction action="opportunities:view"><OpportunityDetail /></RequireAction>}
                />
                <Route
                  path="projects"
                  element={<RequireAction action="projects:view"><ProjectsHub /></RequireAction>}
                />
                {/* Stable "My Project" nav target — mirrors ProfileDetail's
                    isOwn branching (one component handles both edit + view)
                    rather than a separate editor component/route. Resolves
                    to the Builder's real project id at navigation time
                    (MyProjectRedirect) rather than a hardcoded id, since
                    every Builder's project id is a live-generated UUID. */}
                <Route path="projects/mine" element={<MyProjectRedirect />} />
                <Route
                  path="projects/:id"
                  element={<RequireAction action="projects:view"><ProjectDetail /></RequireAction>}
                />
                <Route
                  path="profiles"
                  element={<RequireAction action="profiles:view"><ProfilesLayout /></RequireAction>}
                >
                  <Route index element={<ProfilesList />} />
                  <Route path=":id" element={<ProfileDetail />} />
                </Route>
                <Route
                  path="calendar"
                  element={<RequireAction action="calendar:view"><Calendar /></RequireAction>}
                />
                <Route
                  path="competitions/:id"
                  element={<RequireAction action="calendar:view"><CompetitionDetail /></RequireAction>}
                />
                <Route
                  path="messages"
                  element={<RequireAction action="messages:view"><Messages /></RequireAction>}
                />
                {/* Old "Post a Project" destination — now the real Projects
                    feature lives at /projects/mine, keep any stale link working. */}
                <Route path="projects/new" element={<Navigate to="/dashboard/projects/mine" replace />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route
                  path="admin"
                  element={<RequireAction action="moderation:queue:view"><AdminLayout /></RequireAction>}
                >
                  <Route index element={<Navigate to="reports" replace />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route
                    path="content"
                    element={<RequireAction action="moderation:content:remove"><AdminContent /></RequireAction>}
                  />
                  <Route
                    path="users"
                    element={<RequireAction action="moderation:users:view"><AdminUsers /></RequireAction>}
                  />
                  <Route path="roles" element={<RequireAction action="roles:assign"><AdminRoles /></RequireAction>} />
                </Route>
              </Route>
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />

              {/* Hidden internal admin panel -- not linked from any nav, own
                  email+password login (separate from GitHub/LinkedIn auth
                  above), own layout/theme. Real authorization is RLS via
                  app.is_internal_admin(), not this routing -- see
                  supabase/migrations/20260723120000_internal_admins.sql. */}
              <Route path="/internal/login" element={<InternalLogin />} />
              <Route path="/internal" element={<InternalLayout />}>
                <Route index element={<Navigate to="waitlist" replace />} />
                <Route path="waitlist" element={<InternalWaitlist />} />
                <Route path="feedback" element={<InternalFeedback />} />
                <Route path="competitions" element={<InternalCompetitions />} />
                <Route path="contest" element={<InternalContest />} />
              </Route>
            </Routes>
          </BrowserRouter>
          </CommunityStatsProvider>
          </NotificationsProvider>
          </OpportunitiesProvider>
          </CompetitionsProvider>
          </ClubsProvider>
          </WebinarsProvider>
          </CurrentActivityProvider>
          </ProjectsProvider>
          </MessagesProvider>
        </ProfilesProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
