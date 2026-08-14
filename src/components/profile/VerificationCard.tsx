import * as React from 'react'
import { ShieldCheck, TriangleAlert } from 'lucide-react'
import { useAuth, type OAuthProvider } from '@/lib/auth-context'
import { useProfiles } from '@/lib/profiles-context'
import { LabelCaps } from '@/components/ui/label-caps'
import { VerifiedBadge } from '@/components/profile/VerifiedBadge'
import { providerLabel, type VerifiedProvider } from '@/lib/verification'
import { errorMessage, cn } from '@/lib/utils'

// Brand marks, inlined for the same reason sign-in.tsx inlines them:
// lucide-react ships no brand glyphs, and a generic icon on an OAuth button
// makes people hesitate about where they're being sent.
function GithubMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.207 11.387.6.113.793-.26.793-.577 0-.285-.01-1.04-.016-2.04-3.338.725-4.042-1.61-4.042-1.61-.546-1.386-1.332-1.756-1.332-1.756-1.089-.744.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.42-1.305.763-1.605-2.665-.303-5.467-1.332-5.467-5.93 0-1.31.469-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.3 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.655 1.652.243 2.873.12 3.176.77.84 1.235 1.911 1.235 3.221 0 4.61-2.807 5.624-5.48 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .32.192.694.801.576C20.566 21.795 24 17.298 24 12c0-6.63-5.37-12-12-12Z" />
    </svg>
  )
}

function LinkedinMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124ZM7.114 20.452H3.558V9h3.556v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
    </svg>
  )
}

const LINK_PROVIDERS: {
  id: Exclude<OAuthProvider, 'google'>
  icon: React.ReactNode
  // Mirrors sign-in.tsx: LinkedIn stays visible-but-disabled until the
  // provider is actually configured in the Supabase dashboard, so the option
  // reads as on the way rather than as something that quietly never existed.
  comingSoon?: boolean
}[] = [
  { id: 'github', icon: <GithubMark /> },
  { id: 'linkedin', icon: <LinkedinMark />, comingSoon: true },
]

/**
 * Account verification — the in-app path to a badge without starting a second
 * account.
 *
 * Since Google sign-ins became full members, this grants no access: it is a
 * trust signal and nothing else. The copy below has to reflect that honestly,
 * because promising "unlock full access" to someone who already has it reads
 * as a dark pattern the moment they notice.
 *
 * Still rendered above Settings' "couldn't load your profile" early return —
 * that branch is now rare (it means the profile row hasn't landed yet), but
 * this card is exactly what someone in that state may want to reach.
 */
export function VerificationCard() {
  const { user, linkProvider, refreshVerification } = useAuth()
  const { refresh: refreshProfiles } = useProfiles()

  const [busy, setBusy] = React.useState<VerifiedProvider | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const verified = user?.status === 'builder' && user.verified
  const via = user?.status === 'builder' ? user.verifiedVia : undefined

  // Coming back from the provider lands on this page with a session whose
  // access token was minted *before* the identity existed, so its claims still
  // say "preview". Re-mint once on mount for anyone not yet verified; without
  // this the round trip looks like it silently failed until the token expires.
  const settled = React.useRef(false)
  React.useEffect(() => {
    if (verified || settled.current || !user) return
    settled.current = true
    void (async () => {
      try {
        await refreshVerification()
        // The profiles table only becomes readable once the session is a
        // Builder, so the snapshot taken during preview is empty and has to be
        // re-taken — otherwise Settings keeps showing "couldn't load".
        await refreshProfiles()
      } catch {
        // A failed refresh just means "still not verified"; the card below
        // already says so, and shouting about it would be noise.
      }
    })()
  }, [verified, user, refreshVerification, refreshProfiles])

  async function handleLink(provider: Exclude<OAuthProvider, 'google'>) {
    setError(null)
    setBusy(provider)
    try {
      // Redirects away on success — nothing after this runs in that case.
      await linkProvider(provider)
    } catch (err) {
      setBusy(null)
      setError(
        errorMessage(
          err,
          `Couldn't start ${providerLabel(provider)} verification. If this keeps happening, sign out and sign back in with ${providerLabel(provider)} instead.`,
        ),
      )
    }
  }

  return (
    <section className="mb-10">
      <LabelCaps className="block mb-3">Verification</LabelCaps>

      {verified ? (
        <div className="rounded-lg border border-gold-dark/30 bg-gold-dark/8 p-5">
          <div className="flex items-center gap-2 mb-1.5">
            <VerifiedBadge provider={via} size="md" />
            <span className="font-sans text-[0.9375rem] font-semibold text-dark-text">
              {via ? `Verified through ${providerLabel(via)}` : 'Verified'}
            </span>
          </div>
          <p className="font-sans text-[0.8125rem] leading-[1.55] text-white/65">
            The check appears next to your name everywhere on eengineer — your profile, the
            Q&amp;A feed, discussions, and messages. It tells other members there's a real,
            established account behind your posts.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-start gap-2.5 mb-3">
            <ShieldCheck size={18} strokeWidth={1.8} className="text-dark-muted flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-sans text-[0.9375rem] font-semibold text-dark-text mb-1">
                No verified badge yet
              </p>
              <p className="font-sans text-[0.8125rem] leading-[1.55] text-white/65">
                Your account already has everything unlocked — this doesn't change what you can
                do. What it changes is what other members see: linking GitHub puts a check next
                to your name, backed by a real account with a public history, which carries
                weight when you're asking a stranger to collaborate. Same account throughout —
                your profile, projects and connections all stay.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            {LINK_PROVIDERS.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={p.comingSoon || busy !== null}
                onClick={() => void handleLink(p.id)}
                className={cn(
                  'flex items-center justify-center gap-2 rounded px-4 py-2.5',
                  'font-sans text-[0.8125rem] font-semibold transition-colors duration-150',
                  p.comingSoon
                    ? 'bg-white/5 text-white/35 cursor-not-allowed'
                    : 'bg-gold-dark text-dark-900 hover:bg-gold-dark/85 disabled:opacity-50 disabled:pointer-events-none',
                )}
              >
                {p.icon}
                {p.comingSoon
                  ? `${providerLabel(p.id)} — coming soon`
                  : busy === p.id
                    ? 'Redirecting…'
                    : `Verify with ${providerLabel(p.id)}`}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-start gap-2 mt-3" role="alert">
              <TriangleAlert size={14} strokeWidth={1.8} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="font-sans text-[0.75rem] leading-[1.5] text-red-400">{error}</p>
            </div>
          )}

          <p className="font-sans text-[0.75rem] leading-[1.5] text-dark-muted mt-3">
            We read your public profile only — no repositories, no private data, nothing written
            back to your account.
          </p>
        </div>
      )}
    </section>
  )
}
