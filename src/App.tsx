import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/lib/auth-context'
import { ProfilesProvider } from '@/lib/profiles-context'
import { MessagesProvider } from '@/lib/messages-context'
import { ProjectsProvider } from '@/lib/projects-context'
import { WebinarsProvider } from '@/lib/webinars-context'
import { Welcome } from '@/pages/Welcome'
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
import { ME_PROJECT_ID } from '@/lib/projects-data'
import { ProfilesLayout } from '@/pages/dashboard/profiles/ProfilesLayout'
import { ProfilesList } from '@/pages/dashboard/profiles/ProfilesList'
import { ProfileDetail } from '@/pages/dashboard/profiles/ProfileDetail'
import { Calendar } from '@/pages/dashboard/Calendar'
import { CompetitionDetail } from '@/pages/dashboard/CompetitionDetail'
import { Messages } from '@/pages/dashboard/Messages'
import { SettingsPage } from '@/pages/dashboard/Settings'
import { Terms } from '@/pages/legal/Terms'
import { Privacy } from '@/pages/legal/Privacy'
import { RequireAction } from '@/components/dashboard/RequireAction'
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
          <WebinarsProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/"     element={<Welcome />} />
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
                  path="projects"
                  element={<RequireAction action="projects:view"><ProjectsHub /></RequireAction>}
                />
                {/* Stable "My Project" nav target — mirrors ProfileDetail's
                    isOwn branching (one component handles both edit + view)
                    rather than a separate editor component/route. */}
                <Route
                  path="projects/mine"
                  element={<Navigate to={`/dashboard/projects/${ME_PROJECT_ID}`} replace />}
                />
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
              </Route>
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
            </Routes>
          </BrowserRouter>
          </WebinarsProvider>
          </ProjectsProvider>
          </MessagesProvider>
        </ProfilesProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
