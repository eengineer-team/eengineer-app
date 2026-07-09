import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { SettingsMenu } from '@/components/SettingsMenu'
import { Wordmark } from '@/components/ui/wordmark'

// Step 13 deferred hook: content is intentionally NOT written yet (spec
// defers ToS/Privacy copy to before public release — see PROGRESS.md open
// question #7). This just mounts a correctly-routed, non-broken destination
// so the "By continuing, you agree to..." link in AuthForm has somewhere
// real to go, instead of dead/missing links.
export function LegalPlaceholder({ title }: { title: string }) {
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

      <main className="flex-1 flex flex-col items-center justify-center px-10 py-16 text-center">
        <span className="font-sans text-[10px] font-medium tracking-[0.22em] uppercase text-corn-700 mb-4">
          Legal
        </span>
        <h1 className="font-display font-bold text-[#2A2118] text-[clamp(2rem,3.8vw,2.75rem)] leading-[1.05] tracking-[-0.02em] mb-3">
          {title}
        </h1>
        <p className="font-sans text-[0.9375rem] text-corn-800 max-w-[420px]">
          Coming soon. Final {title.toLowerCase()} copy is being drafted before public release.
        </p>
      </main>
    </div>
  )
}
