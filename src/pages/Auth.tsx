import * as React from 'react'
import { motion } from 'framer-motion'
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { ArrowLeft, TriangleAlert } from 'lucide-react'
import { SettingsMenu } from '@/components/SettingsMenu'
import { AuthForm } from '@/components/ui/sign-in'
import { Wordmark } from '@/components/ui/wordmark'
import { AppLoader } from '@/components/AppLoader'
import { useAuth, type OAuthProvider } from '@/lib/auth-context'

export function Auth() {
  const [params] = useSearchParams()
  const mode = params.get('mode') === 'signup' ? 'signup' : 'login'
  const location = useLocation()
  const { user, loading, signInWithProvider } = useAuth()
  const [loadingProvider, setLoadingProvider] = React.useState<OAuthProvider | null>(null)

  // Already signed in as a real Builder? Don't sit on the auth screen — send
  // forward. (Fixes the post-OAuth loop: the redirect lands here before the
  // async session resolves.)
  //
  // A lingering `preview` (Google) session is deliberately NOT included here.
  // This page is reached by pressing "Sign up" from the landing page, and a
  // stale preview session from earlier browsing used to hijack that: the
  // moment /auth mounted it saw `user` truthy and bounced straight to
  // /dashboard/community before the GitHub/Google chooser ever rendered --
  // "Hello, Preview" instead of a sign-up screen, with no way to pick GitHub.
  // Preview users need to see this page so they can upgrade via GitHub.
  if (loading) return <AppLoader />
  if (user && user.status !== 'preview') {
    return <Navigate to="/dashboard" replace />
  }

  // Shown either when a Google-preview session got redirected here off a
  // Builder-only route (see the `upgrade` nav state in App.tsx / Sidebar.tsx),
  // or when a preview session is just sitting on this page directly (e.g.
  // pressed "Sign up" while already in preview) -- same message either way:
  // you're not signed out, you're previewing, GitHub gets you full access.
  const upgradePrompt =
    Boolean((location.state as { upgrade?: boolean } | null)?.upgrade) || user?.status === 'preview'

  // Real Supabase OAuth: signInWithProvider redirects the browser to the
  // provider and back to `redirectPath`, where detectSessionInUrl completes the
  // handshake. Google returns a preview (no profile → read-only); GitHub/LinkedIn
  // return a verified Builder. New Builders land on /onboarding, returning ones
  // on /dashboard; preview can only reach /dashboard/community.
  function handleOAuth(provider: OAuthProvider) {
    setLoadingProvider(provider)
    const redirectPath =
      provider === 'google'
        ? '/dashboard/community'
        : mode === 'signup'
          ? '/onboarding'
          : '/dashboard'
    signInWithProvider(provider, redirectPath)
  }

  return (
    <div className="min-h-screen bg-corn-100 flex flex-col">
      {/* Header — same pattern as Welcome/Help */}
      <header className="flex items-center justify-between px-10 pt-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <Link to="/home" className="flex items-center group">
            <Wordmark variant="light" className="transition-opacity group-hover:opacity-70" />
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.08 }}>
          <SettingsMenu />
        </motion.div>
      </header>

      {/* Back */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.12 }}
        className="px-10 pt-7"
      >
        <Link
          to="/home"
          className="inline-flex items-center gap-1.5 font-sans text-[0.8125rem] text-corn-700 hover:text-[#2A2118] transition-colors"
        >
          <ArrowLeft size={13} strokeWidth={2} />
          Back
        </Link>
      </motion.div>

      {/* Form */}
      <main className="flex-1 flex items-center justify-center px-10 py-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {upgradePrompt && (
            <div className="flex items-start gap-2.5 rounded border border-amber-600/25 bg-amber-600/8 px-4 py-3 mb-4 max-w-[420px]">
              <TriangleAlert size={15} strokeWidth={1.8} className="text-amber-800 flex-shrink-0 mt-0.5" />
              <p className="font-sans text-[0.75rem] leading-[1.5] text-amber-900">
                That section is only open to verified Builders. Sign in with GitHub to
                upgrade from Google preview and unlock full access (LinkedIn sign-in is
                coming soon).
              </p>
            </div>
          )}
          <AuthForm
            mode={mode}
            loadingProvider={loadingProvider}
            onOAuth={handleOAuth}
          />
        </motion.div>
      </main>
    </div>
  )
}
