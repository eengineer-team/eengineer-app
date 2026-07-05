import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Step 13 deferred hook: "Project Onboarding flow" (display name, discipline
// picker, etc. for a brand-new signup) is intentionally NOT built yet — only
// mounted so the signup funnel doesn't dead-end or skip a step that will
// exist later. Reached from Auth.tsx right after a signup-mode OAuth mock;
// login-mode skips straight to /dashboard since returning Builders don't
// need onboarding again.
export function Onboarding() {
  return (
    <div className="min-h-screen bg-corn-100 flex flex-col items-center justify-center px-10 text-center">
      <span className="font-display text-[#2A2118] text-[1.25rem] font-bold tracking-[-0.03em] leading-none mb-2">
        ee
      </span>
      <span className="font-sans text-[10px] font-medium tracking-[0.22em] uppercase text-corn-700 mb-8">
        engineer
      </span>

      <span className="font-sans text-[10px] font-medium tracking-[0.22em] uppercase text-corn-700 mb-4">
        Welcome, Builder
      </span>
      <h1 className="font-display font-bold text-[#2A2118] text-[clamp(2rem,3.8vw,2.75rem)] leading-[1.05] tracking-[-0.02em] mb-3">
        Onboarding is coming soon.
      </h1>
      <p className="font-sans text-[0.9375rem] text-corn-800 max-w-[420px] mb-8">
        Soon this is where you'd pick your discipline and set up your profile. For now, jump
        straight into the network.
      </p>

      <Button asChild variant="primary" size="lg" className="gap-2 font-sans text-[0.8125rem] font-semibold tracking-[0.05em] uppercase">
        <Link to="/dashboard">
          Continue to dashboard
          <ArrowRight size={13} strokeWidth={2.5} />
        </Link>
      </Button>
    </div>
  )
}
