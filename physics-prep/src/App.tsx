import { Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { LandingPage } from '@/features/landing/LandingPage'
import { PricingPage } from '@/features/landing/PricingPage'
import { PracticeListPage } from '@/features/practice/PracticeListPage'
import { ProblemPage } from '@/features/practice/ProblemPage'
import { ToolsPage } from '@/features/tools/ToolsPage'
import { FreeBodyPage } from '@/features/fbd/FreeBodyPage'
import { MotionPage } from '@/features/motion/MotionPage'
import { NotFound } from '@/components/NotFound'

// Route map is owned by the scaffold. Each feature folder owns its page component.
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/pro" element={<PricingPage />} />
        <Route path="/practice" element={<PracticeListPage />} />
        <Route path="/practice/:problemId" element={<ProblemPage />} />
        <Route path="/tools" element={<ToolsPage />} />
        <Route path="/tools/free-body" element={<FreeBodyPage />} />
        <Route path="/tools/motion" element={<MotionPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
