import * as React from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { SettingsMenu } from '@/components/SettingsMenu'
import { FeedbackMenu } from '@/components/FeedbackMenu'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/ui/wordmark'
import { LabelCaps } from '@/components/ui/label-caps'
import { supabase } from '@/lib/supabase'
import { errorMessage } from '@/lib/utils'

const inputClass =
  'w-full bg-white/50 border border-corn-900/15 rounded px-4 py-2.5 font-sans text-sm text-[#2A2118] placeholder:text-corn-800/40 focus:outline-none focus:border-corn-700/50'

// Interstitial shown at "/" before the real marketing landing (now at
// /home). Deliberately not a hard gate — the "Already have an account?"
// link below always works, so nobody who already knows they want to sign up
// or log in is blocked by this. This table has no read policy for anon —
// see supabase/migrations/20260720160000_waitlist_signups.sql — the founder
// reviews signups directly via SQL until there's an admin UI worth building
// for it.
export function Waitlist() {
  const navigate = useNavigate()
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [organization, setOrganization] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [submitted, setSubmitted] = React.useState(false)

  // Thanks screen holds for a beat so it actually reads as a confirmation,
  // then moves on to the real landing rather than leaving the person stuck
  // on a dead-end screen.
  React.useEffect(() => {
    if (!submitted) return
    const t = setTimeout(() => navigate('/home'), 2200)
    return () => clearTimeout(t)
  }, [submitted, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    const trimmedName = name.trim()
    const trimmedOrg = organization.trim()
    const trimmedEmail = email.trim()
    if (!trimmedName || !trimmedOrg || !trimmedEmail) {
      setError('Fill in your name, email, and school or organization.')
      return
    }
    setSubmitting(true)
    setError(null)
    const { error: insertError } = await supabase
      .from('waitlist_signups')
      .insert({ name: trimmedName, email: trimmedEmail, organization: trimmedOrg })
    setSubmitting(false)
    if (insertError) {
      // Unique violation on email — treat as success rather than confusing
      // someone who already signed up with a raw constraint error.
      if ((insertError as { code?: string }).code === '23505') {
        setSubmitted(true)
        return
      }
      setError(errorMessage(insertError, "Couldn't join the waitlist. Try again in a moment."))
      return
    }
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-corn-100 flex flex-col">
      <header className="flex items-center justify-between px-5 sm:px-10 pt-6 sm:pt-8 pb-0">
        <Wordmark variant="light" />
        <div className="flex items-center gap-1">
          <FeedbackMenu />
          <SettingsMenu />
        </div>
      </header>

      <main className="relative isolate flex-1 flex flex-col items-center justify-center px-5 sm:px-10 py-10 bg-graph-paper">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 w-full max-w-[440px]"
        >
          {submitted ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-corn-900/10 flex items-center justify-center mx-auto mb-5">
                <Check size={22} strokeWidth={2} className="text-corn-900" />
              </div>
              <h1 className="font-display font-bold text-[#2A2118] text-[1.75rem] leading-[1.1] tracking-[-0.01em] mb-3">
                You're on the list
              </h1>
              <p className="font-sans text-[0.9375rem] leading-[1.6] text-corn-700">
                Thanks — we'll be in touch. Taking you to the site now.
              </p>
            </div>
          ) : (
            <>
              <LabelCaps theme="welcome" className="block mb-3">Early access</LabelCaps>
              <h1 className="font-display font-bold text-[#2A2118] text-[1.9rem] leading-[1.1] tracking-[-0.01em] mb-3">
                Join the waitlist
              </h1>
              <p className="font-sans text-[0.9375rem] leading-[1.6] text-corn-700 mb-8 max-w-[400px]">
                eengineer.net is opening up gradually. Leave your details and we'll reach out when
                there's a spot for you.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mb-5">
                <div>
                  <LabelCaps theme="welcome" className="block mb-2">Name</LabelCaps>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className={inputClass}
                    autoComplete="name"
                  />
                </div>
                <div>
                  <LabelCaps theme="welcome" className="block mb-2">Email</LabelCaps>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                    autoComplete="email"
                  />
                </div>
                <div>
                  <LabelCaps theme="welcome" className="block mb-2">School or organization</LabelCaps>
                  <input
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. Lincoln High School"
                    className={inputClass}
                    autoComplete="organization"
                  />
                </div>

                {error && (
                  <p className="font-sans text-[0.8125rem] text-red-700" role="alert">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={submitting}
                  className="gap-2 font-sans text-[0.8125rem] font-semibold tracking-[0.05em] uppercase mt-2"
                >
                  {submitting ? 'Joining…' : 'Join the waitlist'}
                  <ArrowRight size={13} strokeWidth={2.5} />
                </Button>
              </form>

              <p className="font-sans text-[0.8125rem] text-corn-700 text-center">
                Already have an account?{' '}
                <Link
                  to="/home"
                  className="underline underline-offset-2 hover:text-[#2A2118] transition-colors"
                >
                  Continue to the site
                </Link>
              </p>
            </>
          )}
        </motion.div>
      </main>
    </div>
  )
}
