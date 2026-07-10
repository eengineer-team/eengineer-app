import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { SettingsMenu } from '@/components/SettingsMenu'
import { Wordmark } from '@/components/ui/wordmark'
import { LabelCaps } from '@/components/ui/label-caps'

export function LegalDocument({
  title,
  lastUpdated,
  children,
}: {
  title: string
  lastUpdated: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-corn-100 flex flex-col">
      <header className="flex items-center justify-between px-10 pt-8">
        <Link to="/" className="flex items-center group">
          <Wordmark variant="light" className="transition-opacity group-hover:opacity-70" />
        </Link>
        <SettingsMenu />
      </header>

      <div className="px-10 pt-7">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 font-sans text-[0.8125rem] text-corn-700 hover:text-[#2A2118] transition-colors"
        >
          <ArrowLeft size={13} strokeWidth={2} />
          Back
        </Link>
      </div>

      <main className="flex-1 px-10 py-16">
        <div className="max-w-[640px] mx-auto">
          <LabelCaps theme="welcome" className="mb-4 block">
            Legal
          </LabelCaps>
          <h1 className="font-display font-bold text-[#2A2118] text-[clamp(2rem,3.8vw,2.75rem)] leading-[1.05] tracking-[-0.02em] mb-2">
            {title}
          </h1>
          <p className="font-sans text-[0.8125rem] text-corn-700 mb-10">
            Draft — last updated {lastUpdated}. We'll notify users before this changes in
            any material way.
          </p>

          <div className="font-sans text-[0.9375rem] leading-[1.7] text-corn-900 space-y-6 pb-16">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display font-semibold text-[#2A2118] text-[1.125rem] mb-2">
        {heading}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}
