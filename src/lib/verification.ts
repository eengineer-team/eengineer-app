// Trust verification — the one place that decides what "verified" means on
// the client. The claim itself is made in the database (profiles.verified is
// written only by app.apply_verified_identity, which reads auth.identities);
// everything here is display-side only and must never be treated as a gate.
// See supabase/migrations/20260814120000_oauth_verification.sql.

export type VerifiedProvider = 'github' | 'linkedin'

const LABELS: Record<VerifiedProvider, string> = {
  github: 'GitHub',
  linkedin: 'LinkedIn',
}

/**
 * Normalises whatever the provider column / JWT claim / Supabase session
 * reports into the two providers that actually carry a trust signal.
 * Supabase names its LinkedIn provider `linkedin_oidc`, which is why this
 * cannot be a plain cast — that mismatch is exactly what left LinkedIn
 * signups unverified before.
 */
export function verifiedProviderFrom(raw: string | null | undefined): VerifiedProvider | undefined {
  if (!raw) return undefined
  if (raw === 'github') return 'github'
  if (raw === 'linkedin' || raw === 'linkedin_oidc') return 'linkedin'
  return undefined
}

export function providerLabel(provider: VerifiedProvider): string {
  return LABELS[provider]
}

/** Tooltip / screen-reader text. Kept here so every surface says the same thing. */
export function verifiedLabel(provider: VerifiedProvider | undefined): string {
  return provider
    ? `Verified — identity confirmed through ${providerLabel(provider)}`
    : 'Verified — identity confirmed through a linked developer account'
}
