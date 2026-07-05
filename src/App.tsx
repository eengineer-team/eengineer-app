import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { Welcome } from '@/pages/Welcome'
import { Auth } from '@/pages/Auth'
import { Help } from '@/pages/Help'
import { Dashboard } from '@/pages/Dashboard'
import { DashboardHome } from '@/pages/dashboard/DashboardHome'
import { Community } from '@/pages/dashboard/Community'
import { PlaceholderSection } from '@/pages/dashboard/PlaceholderSection'
import './index.css'

// TEMPORARY (step A) — inline status check. Everything not Community/Opportunities
// is Builder-only for Google-preview sessions. Will be replaced by a centralized
// can(user, action) permissions system in step B; don't build more on this shape.
function BuilderOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  if (user?.status === 'preview') {
    return <Navigate to="/auth" state={{ upgrade: true, from: location.pathname }} replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/"     element={<Welcome />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/help" element={<Help />} />
            <Route path="/dashboard" element={<Dashboard />}>
              <Route index                element={<BuilderOnly><DashboardHome /></BuilderOnly>} />
              <Route path="community"      element={<Community />} />
              <Route path="opportunities" element={<PlaceholderSection label="Opportunities" />} />
              <Route path="profiles"      element={<BuilderOnly><PlaceholderSection label="Profiles" /></BuilderOnly>} />
              <Route path="calendar"      element={<BuilderOnly><PlaceholderSection label="Competition Calendar" /></BuilderOnly>} />
              <Route path="messages"      element={<BuilderOnly><PlaceholderSection label="Messages" /></BuilderOnly>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
