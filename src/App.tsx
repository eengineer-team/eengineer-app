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
import { Waitlist } from '@/pages/Waitlist'
import { Auth } from '@/pages/Auth'
import { Onboarding } from '@/pages/Onboarding'
import { Help } from '@/pages/Help'
import { Dashboard } from '@/pages/Dashboard'
import { DashboardHome } from '@/pages/dashboard/DashboardHome'
import { Community } from '@/pages/dashboard/Community'
import { CommunityHub } from '@/pages/dashboard/community/CommunityHub'
import { CommunityGroup } from '@/pages/dashboard/community/CommunityGroup'
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
              {/* "/" is the waitlist interstitial (2026-07 launch decision) --
                  the real marketing landing moved to /home. Not a hard gate:
                  the waitlist screen always links straight through to /home
                  for anyone who already knows they want to sign up or log in. */}
              <Route path="/"     element={<Waitlist />} />
              <Route path="/home" element={<Welcome />} />
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
