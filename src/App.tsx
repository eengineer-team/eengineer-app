import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from 'next-themes'
import { Welcome } from '@/pages/Welcome'
import { Auth } from '@/pages/Auth'
import { Help } from '@/pages/Help'
import { Dashboard } from '@/pages/Dashboard'
import './index.css'

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <BrowserRouter>
        <Routes>
          <Route path="/"          element={<Welcome />} />
          <Route path="/auth"      element={<Auth />} />
          <Route path="/help"      element={<Help />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
