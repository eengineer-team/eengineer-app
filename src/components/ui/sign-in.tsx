import * as React from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

const PROVIDERS: {
  id: OAuthProvider
  label: string
  icon: React.ReactNode
  badge: string
  badgeClass: string
}[] = [
  {
    id: 'github',
    label: 'GitHub',
    icon: <GithubMark />,
    badge: 'Full access',
    badgeClass: 'bg-emerald-700/10 text-emerald-800 border-emerald-700/20',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: <LinkedinMark />,
    badge: 'Full access',
    badgeClass: 'bg-emerald-700/10 text-emerald-800 border-emerald-700/20',
  },
  {
    id: 'google',
    label: 'Google',
    icon: <GoogleMark />,
    badge: 'Limited preview',
    badgeClass: 'bg-amber-600/10 text-amber-800 border-amber-600/25',
  },
]

export interface AuthFormProps {
  mode: 'signup' | 'login'
  loadingProvider: OAuthProvider | 'email' | null
  onOAuth: (provider: OAuthProvider) => void
  onEmailSubmit: (email: string, password: string) => void
}

export function AuthForm({ mode, loadingProvider, onOAuth, onEmailSubmit }: AuthFormProps) {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)

  const busy = loadingProvider !== null

  return (
    <div className="w-full max-w-[420px]">
      <div className="mb-7">
        <h1 className="font-display font-bold text-[#2A2118] text-[1.75rem] leading-[1.1] tracking-[-0.01em] mb-2.5">
          {mode === 'signup' ? 'Create your account' : 'Welcome back'}
        </h1>
      </div>

      {/* OAuth providers */}
      <div className="flex flex-col gap-2.5 mb-4">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={busy}
            onClick={() => onOAuth(p.id)}
            className="
              w-full flex items-center justify-between gap-3
              border border-corn-900/15 rounded bg-white/50
              px-4 py-3 font-sans text-sm font-medium text-[#2A2118]
              hover:bg-white/80 hover:border-corn-900/25 transition-all duration-150
              disabled:opacity-50 disabled:pointer-events-none
            "
          >
            <span className="flex items-center gap-2.5">
              {p.icon}
              {loadingProvider === p.id ? 'Connecting…' : p.label}
            </span>
            <span
              className={`font-sans text-[10px] font-semibold tracking-wide uppercase border rounded px-1.5 py-0.5 ${p.badgeClass}`}
            >
              {p.badge}
            </span>
          </button>
        ))}
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-2.5 rounded border border-amber-600/25 bg-amber-600/8 px-4 py-3 mb-6">
        <TriangleAlert size={15} strokeWidth={1.8} className="text-amber-800 flex-shrink-0 mt-0.5" />
        <p className="font-sans text-[0.75rem] leading-[1.5] text-amber-900">
          Google only gets read-only preview access. Everything else is locked until 
          you register through Github or Linkedin. However, neither reuses or stores your data. It is just for the sake of confirming you are a real person.

        </p>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-px flex-1 bg-corn-900/10" />
        <span className="font-sans text-[10px] font-medium tracking-[0.18em] uppercase text-corn-700">
          Or
        </span>
        <div className="h-px flex-1 bg-corn-900/10" />
      </div>

      {/* Email / password */}
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          onEmailSubmit(email, password)
        }}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail size={15} strokeWidth={1.8} className="absolute left-3 top-1/2 -translate-y-1/2 text-corn-700/60" />
            <Input
              id="email"
              type="email"
              placeholder="you@university.edu"
              className="pl-9"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              className="font-sans text-[0.75rem] font-medium text-corn-700 hover:text-[#2A2118] transition-colors"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock size={15} strokeWidth={1.8} className="absolute left-3 top-1/2 -translate-y-1/2 text-corn-700/60" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="pl-9 pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-corn-700/60 hover:text-corn-900 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={15} strokeWidth={1.8} /> : <Eye size={15} strokeWidth={1.8} />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={busy}
          className="w-full font-sans text-[0.8125rem] font-semibold tracking-[0.05em] uppercase mt-1"
        >
          {loadingProvider === 'email' ? 'Signing in…' : mode === 'signup' ? 'Sign up' : 'Sign in'}
        </Button>
      </form>

      <p className="font-sans text-[0.75rem] leading-[1.5] text-corn-700 mt-6 text-center">
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
