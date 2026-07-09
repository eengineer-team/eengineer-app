import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/lib/auth-context'
import { ProfilesProvider } from '@/lib/profiles-context'
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
import { PlaceholderSection } from '@/pages/dashboard/PlaceholderSection'
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
                <Route
                  path="projects/new"
                  element={<PlaceholderSection label="Post a Project" />}
                />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
            </Routes>
          </BrowserRouter>
        </ProfilesProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
