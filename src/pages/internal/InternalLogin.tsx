import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import * as internalApi from '@/lib/api/internal'
import { errorMessage } from '@/lib/utils'
import { ADMIN_PANEL_PATH } from '@/pages/internal/InternalLayout'

// Deliberately separate from /auth (GitHub/LinkedIn OAuth) -- plain email +
// password, unrelated to the builder-facing sign-in. Signing up here does
// NOT grant access to anything: app.handle_new_user only creates a
// profiles/user_roles row for github/linkedin providers, and every /internal
// table is gated by app.is_internal_admin(), a manual SQL allowlist (see
// supabase/migrations/20260723120000_internal_admins.sql). A freshly
// signed-up account can log in here and will just see "not authorized"
// until someone with database access adds their user_id to internal_admins.
export function InternalLogin() {
  const navigate = useNavigate()
  const [mode, setMode] = React.useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [signedUp, setSignedUp] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      if (mode === 'signin') {
        await internalApi.internalSignIn(email, password)
        navigate(ADMIN_PANEL_PATH)
      } else {
        await internalApi.internalSignUp(email, password)
        setSignedUp(true)
      }
    } catch (err) {
      setError(errorMessage(err, 'Something went wrong — try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1D1C1C] flex items-center justify-center px-4">
      <div className="w-full max-w-[360px]">
        <p className="font-sans text-[13px] tracking-[0.08em] uppercase text-[#F0F0F0]/40 mb-6 text-center">
          eengineer / internal
        </p>

        {signedUp ? (
          <div className="border border-[#F0F0F0]/12 rounded-lg p-6 text-center">
            <p className="font-sans text-[0.875rem] text-[#F0F0F0] mb-2">Account created.</p>
            <p className="font-sans text-[0.8125rem] text-[#F0F0F0]/60 leading-snug">
              Ask whoever has database access to grant this email access, then sign in.
            </p>
            <button
              onClick={() => {
                setSignedUp(false)
                setMode('signin')
              }}
              className="mt-4 font-sans text-[0.8125rem] text-[#F0F0F0] underline underline-offset-2 hover:no-underline"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="border border-[#F0F0F0]/12 rounded-lg p-6">
            <div className="flex flex-col gap-3 mb-4">
              <div>
                <label className="block font-sans text-[12px] tracking-wide uppercase text-[#F0F0F0]/50 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#F0F0F0]/[0.04] border border-[#F0F0F0]/12 rounded px-3 py-2.5 font-sans text-[0.8125rem] text-[#F0F0F0] placeholder:text-[#F0F0F0]/30 focus:outline-none focus:border-[#F0F0F0]/35"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block font-sans text-[12px] tracking-wide uppercase text-[#F0F0F0]/50 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#F0F0F0]/[0.04] border border-[#F0F0F0]/12 rounded px-3 py-2.5 font-sans text-[0.8125rem] text-[#F0F0F0] placeholder:text-[#F0F0F0]/30 focus:outline-none focus:border-[#F0F0F0]/35"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <p className="font-sans text-[0.8125rem] text-red-400 mb-3" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#F0F0F0] text-[#1D1C1C] font-sans text-[0.8125rem] font-semibold rounded px-3 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin')
                setError(null)
              }}
              className="w-full mt-3 font-sans text-[0.75rem] text-[#F0F0F0]/50 hover:text-[#F0F0F0] transition-colors"
            >
              {mode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
