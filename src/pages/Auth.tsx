import * as React from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { SettingsMenu } from '@/components/SettingsMenu'
import { AuthForm } from '@/components/ui/sign-in'
import { useAuth, type OAuthProvider } from '@/lib/auth-context'

export function Auth() {
  const [params] = useSearchParams()
  const mode = params.get('mode') === 'signup' ? 'signup' : 'login'
  const navigate = useNavigate()
  const { signInWithProvider } = useAuth()
  const [loadingProvider, setLoadingProvider] = React.useState<OAuthProvider | 'email' | null>(null)

  // Mock OAuth round-trip — a real backend token exchange isn't wired up yet
  // (see PROGRESS.md open question #4). GitHub/LinkedIn become full Builder
  // sessions; Google is a stateless preview per spec — nothing is persisted.
  function handleOAuth(provider: OAuthProvider) {
    setLoadingProvider(provider)
    window.setTimeout(() => {
      signInWithProvider(provider)
      navigate('/dashboard')
    }, 500)
  }

  // Email/password has no distinct backend of its own yet — treated as an
  // equivalent mock Builder sign-in so the form isn't a dead end.
  function handleEmailSubmit(_email: string, _password: string) {
    setLoadingProvider('email')
    window.setTimeout(() => {
      signInWithProvider('github')
      navigate('/dashboard')
    }, 500)
  }

  return (
    <div className="min-h-screen bg-corn-100 flex flex-col">
      {/* Header — same pattern as Welcome/Help */}
      <header className="flex items-center justify-between px-10 pt-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="font-display text-[#2A2118] text-[1.25rem] font-bold tracking-[-0.03em] leading-none group-hover:text-corn-700 transition-colors">
              ee
            </span>
            <span className="font-sans text-[10px] font-medium tracking-[0.22em] uppercase text-corn-700 mt-px">
              engineer
            </span>
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
          to="/"
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
          <AuthForm
            mode={mode}
            loadingProvider={loadingProvider}
            onOAuth={handleOAuth}
            onEmailSubmit={handleEmailSubmit}
          />
        </motion.div>
      </main>
    </div>
  )
}
