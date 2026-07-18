import * as React from 'react'
import { Link } from 'react-router-dom'
import { TriangleAlert } from 'lucide-react'
import type { OAuthProvider } from '@/lib/auth-context'

// lucide-react's icon set doesn't include brand marks — inline the
// standard GitHub/LinkedIn/Google glyphs instead of a generic icon.
function GithubMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.207 11.387.6.113.793-.26.793-.577 0-.285-.01-1.04-.016-2.04-3.338.725-4.042-1.61-4.042-1.61-.546-1.386-1.332-1.756-1.332-1.756-1.089-.744.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.42-1.305.763-1.605-2.665-.303-5.467-1.332-5.467-5.93 0-1.31.469-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.3 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.655 1.652.243 2.873.12 3.176.77.84 1.235 1.911 1.235 3.221 0 4.61-2.807 5.624-5.48 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .32.192.694.801.576C20.566 21.795 24 17.298 24 12c0-6.63-5.37-12-12-12Z" />
    </svg>
  )
}

function LinkedinMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124ZM7.114 20.452H3.558V9h3.556v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
    </svg>
  )
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.5 0-14 4.2-17.7 10.7z"/>
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 35.1 26.9 36 24 36c-5.3 0-9.7-3.1-11.3-7.9l-6.5 5C9.9 39.6 16.4 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.6 5.6C40.5 36.8 44 30.9 44 24c0-1.3-.1-2.7-.4-3.5z"/>
    </svg>
  )
}

const PRIMARY_PROVIDERS: {
  id: OAuthProvider
  label: string
  icon: React.ReactNode
}[] = [
  { id: 'github', label: 'GitHub', icon: <GithubMark /> },
  { id: 'linkedin', label: 'LinkedIn', icon: <LinkedinMark /> },
]

export interface AuthFormProps {
  mode: 'signup' | 'login'
  loadingProvider: OAuthProvider | null
  onOAuth: (provider: OAuthProvider) => void
}

export function AuthForm({ mode, loadingProvider, onOAuth }: AuthFormProps) {
  const busy = loadingProvider !== null

  return (
    <div className="w-full max-w-[420px]">
      <div className="mb-7">
        <h1 className="font-display font-bold text-[#2A2118] text-[1.75rem] leading-[1.1] tracking-[-0.01em] mb-2.5">
          {mode === 'signup' ? 'Create your account' : 'Welcome back'}
        </h1>
      </div>

      {/* Primary OAuth providers — the full-access path, unmistakably the
          recommended CTA: solid fill, larger, listed first. */}
      <div className="flex flex-col gap-2.5 mb-4">
        {PRIMARY_PROVIDERS.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={busy}
            onClick={() => onOAuth(p.id)}
            className="
              w-full flex items-center justify-center gap-2.5
              rounded bg-corn-900 text-corn-100
              px-4 py-3.5 font-sans text-[0.9375rem] font-semibold
              hover:bg-corn-800 active:bg-corn-900 transition-all duration-150
              disabled:opacity-50 disabled:pointer-events-none
            "
          >
            {p.icon}
            {loadingProvider === p.id ? 'Connecting…' : `Continue with ${p.label}`}
            <span className="font-sans text-[10px] font-semibold tracking-wide uppercase text-corn-100/60 ml-1">
              Full access
            </span>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-corn-900/12" />
        <span className="font-sans text-[11px] font-medium uppercase tracking-wide text-corn-700">
          or preview with Google
        </span>
        <div className="h-px flex-1 bg-corn-900/12" />
      </div>

      {/* Secondary — Google, visibly de-emphasized */}
      <div className="mb-4">
        <button
          type="button"
          disabled={busy}
          onClick={() => onOAuth('google')}
          className="
            w-full flex items-center justify-between gap-3
            border border-corn-900/12 rounded bg-transparent
            px-4 py-2.5 font-sans text-[0.8125rem] font-medium text-corn-700
            hover:bg-corn-900/4 hover:text-[#2A2118] transition-all duration-150
            disabled:opacity-50 disabled:pointer-events-none
          "
        >
          <span className="flex items-center gap-2.5">
            <GoogleMark />
            {loadingProvider === 'google' ? 'Connecting…' : 'Continue with Google'}
          </span>
          <span className="font-sans text-[10px] font-semibold tracking-wide uppercase border rounded px-1.5 py-0.5 bg-amber-600/10 text-amber-800 border-amber-600/25">
            Limited preview
          </span>
        </button>
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-2.5 rounded border border-amber-600/25 bg-amber-600/8 px-4 py-3 mb-6">
        <TriangleAlert size={15} strokeWidth={1.8} className="text-amber-800 flex-shrink-0 mt-0.5" />
        <p className="font-sans text-[0.75rem] leading-[1.5] text-amber-900">
          Google gets you a quick, read-only look around — nothing saved, nothing created.
          Want full access? Sign up with GitHub or LinkedIn instead. We don't touch your
          data either way — it's just there to prove you're a real person, not a bot.
        </p>
      </div>

      <p className="font-sans text-[0.75rem] leading-[1.5] text-corn-700 mt-2 text-center">
        By continuing, you agree to our{' '}
        <Link to="/terms" className="underline underline-offset-2 hover:text-[#2A2118] transition-colors">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link to="/privacy" className="underline underline-offset-2 hover:text-[#2A2118] transition-colors">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  )
}
