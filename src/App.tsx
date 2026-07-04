import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/lib/auth-context'
import { Welcome } from '@/pages/Welcome'
import { Auth } from '@/pages/Auth'
import { Help } from '@/pages/Help'
import { Dashboard } from '@/pages/Dashboard'
import { DashboardHome } from '@/pages/dashboard/DashboardHome'
import { Community } from '@/pages/dashboard/Community'
import { PlaceholderSection } from '@/pages/dashboard/PlaceholderSection'
import './index.css'

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
              <Route index                element={<DashboardHome />} />
              <Route path="community"      element={<Community />} />
              <Route path="opportunities" element={<PlaceholderSection label="Opportunities" />} />
              <Route path="profiles"      element={<PlaceholderSection label="Profiles" />} />
              <Route path="calendar"      element={<PlaceholderSection label="Competition Calendar" />} />
              <Route path="messages"      element={<PlaceholderSection label="Messages" />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
