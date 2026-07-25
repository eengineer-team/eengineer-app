import type { Discipline } from '@/lib/community-data'

// Profiles — types and display constants only. The data itself is
// Supabase-backed (lib/api/profiles.ts reads it, profiles-context.tsx holds
// the snapshot); nothing in this file is a data source any more.

export interface Skill {
  name: string
  proficiency: number // 1–5, self-rated
}

export interface ProjectEntry {
  id: string
  title: string
  year: number
  description: string
  image?: string
  video?: string
  skillNames: string[] // ties a project to the skills it demonstrates
}

// A one- or two-word reason ("very good", "great job") isn't evidence of
// anything — this is the shared floor both EndorseDialog (client-side hint/
// disable) and profiles-context (server-side enforcement) check against.
export const MIN_ENDORSEMENT_REASON_LENGTH = 20

export interface Endorsement {
  id: string
  fromName: string
  targetType: 'skill' | 'project'
  targetName: string
  reason: string // mandatory per spec — never optional
  /** Optional link backing up the claim — a PR, a shared doc, a live demo,
   *  a post. Not required (not everything worth endorsing has a public
   *  link), but when present it's shown right alongside the reason so the
   *  endorsement isn't just someone's unverifiable word. */
  evidenceUrl?: string
}

export interface ExperienceEntry {
  id: string
  role: string
  organization: string
  duration: string // free text — "Summer 2025", "2024–Present", etc.
  description: string
}

export interface BackgroundPreset {
  id: string
  label: string
  className: string
}

// Token-based only — no raw hex. Each preset is a subtle tint over
// dark.surface using the existing gold-dark / corn-700 accents.
export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { id: 'slate', label: 'Slate', className: 'bg-dark-surface' },
  { id: 'gold', label: 'Gold', className: 'bg-gradient-to-br from-gold-dark/20 via-dark-surface to-dark-surface' },
  { id: 'corn', label: 'Amber', className: 'bg-gradient-to-br from-corn-700/25 via-dark-surface to-dark-surface' },
  { id: 'deep', label: 'Deep', className: 'bg-gradient-to-br from-dark-surface2 via-dark-surface to-dark-900' },
]

export interface BackgroundImage {
  id: string
  label: string
  /** Real, licensed sample photo — Unsplash License (free to use, verified
   *  per-photo before adding here), not a placeholder or stock-site mockup. */
  url: string
}

// Sample photo backgrounds a Builder can pick without uploading their own.
// Each is a real Unsplash photo, license-checked individually (see the photo
// page linked in each comment) rather than assumed from a search result.
export const BACKGROUND_IMAGES: BackgroundImage[] = [
  {
    id: 'blueprint',
    label: 'Blueprint',
    // https://unsplash.com/photos/architectural-blueprint-of-a-multi-story-building-9tmKEDz03uw — Amsterdam City Archives, Unsplash License
    url: 'https://images.unsplash.com/photo-1721244654394-36a7bc2da288?auto=format&fit=crop&w=1600&q=70',
  },
  {
    id: 'circuit',
    label: 'Circuit board',
    // https://unsplash.com/photos/green-and-white-circuit-board-mbXEkW5ZyBQ — Magnus Engø, Unsplash License
    url: 'https://images.unsplash.com/photo-1555589228-135c25ae8cf5?auto=format&fit=crop&w=1600&q=70',
  },
  {
    id: 'workshop',
    label: 'Workshop',
    // https://unsplash.com/photos/close-up-of-an-old-metal-lathe-in-a-workshop-_VBsh_IKsD8 — LISK OBE, Unsplash License
    url: 'https://images.unsplash.com/photo-1776090188130-26c7253ff423?auto=format&fit=crop&w=1600&q=70',
  },
  {
    id: 'launch',
    label: 'Launch',
    // https://unsplash.com/photos/rocket-launched-at-nighttime-m010U75wdxE — Bill Jelen, Unsplash License
    url: 'https://images.unsplash.com/photo-1530447920184-b88c8872?auto=format&fit=crop&w=1600&q=70',
  },
]

export interface BuilderProfile {
  id: string
  name: string
  discipline: Discipline
  online: boolean
  bio: string
  backgroundId: string
  /** Sample photo (BACKGROUND_IMAGES) or an uploaded data URL — when set,
   *  this overrides backgroundId's color/gradient in the header banner.
   *  Undefined means "use the solid color instead". */
  backgroundImageUrl?: string
  /** Data URL or hosted image — falls back to initials in <Avatar> until set. */
  avatarUrl?: string
  skills: Skill[]
  projects: ProjectEntry[]
  experience: ExperienceEntry[]
  endorsements: Endorsement[]
  /** OAuth verification links — trust signal per spec, not a data source. */
  githubUrl?: string
  linkedinUrl?: string
  /** Mutual connections with the viewer — not shown on your own profile. */
  mutuals: number
  connectStatus: 'none' | 'requested' | 'connected'
  /** Set during onboarding (Step 13) — surfaced as a badge on the profile. */
  openToWork: boolean
  interests: string[]
  /** Contribution points, summed from the reputation_events ledger by the
   *  profile_reputation view. Read-only here — the client can never write
   *  it (no INSERT policy on the ledger at all; only DB triggers award). */
  reputationPoints: number
  reputationTier: ReputationTier
  /** Privacy toggle (Settings) — undefined/true means DMs are open, same as
   *  every existing seeded profile before this field existed. Only ever
   *  false when the Builder explicitly turns it off. Enforced wherever a
   *  "Message" action would otherwise appear (see ProfilePreviewPopover). */
  allowDMs?: boolean
  /** Collected once at onboarding (Step: age gate) — needed to compute age
   *  for the parental-consent requirement below. Never shown publicly. */
  birthdate?: string
  /** Present only if the Builder was under 18 at onboarding and a
   *  parent/guardian's email was captured as consent — required before
   *  onboarding can proceed for minors (see Onboarding.tsx). Not a real
   *  verification (no backend to confirm the guardian actually consented),
   *  same mock-app caveat as everything else here — but it's a real,
   *  non-skippable form gate, not a decorative checkbox. */
  guardianConsentEmail?: string
}

// Fixed id for whoever is currently signed in — the only profile the
// session can edit. Real name comes from auth-context at render time.
export const ME_ID = 'me'

// Contribution tiers. Thresholds and the point values behind them live in
// supabase/migrations/20260725120000_reputation.sql — this is only the
// display side. "Builder" is the floor everyone starts at rather than a
// zero-state badge, so a new member is never labelled as having done nothing.
export type ReputationTier = 'Builder' | 'Contributor' | 'Mentor' | 'Core'

export const TIER_ORDER: ReputationTier[] = ['Builder', 'Contributor', 'Mentor', 'Core']

// Must stay in sync with the CASE in the profile_reputation view
// (supabase/migrations/20260725120000_reputation.sql, rescaled in
// reputation_tier_thresholds). Calibrated against the real point
// distribution rather than round numbers — at 25/100/300 every existing
// member sat at the floor tier and the badge said nothing.
export const TIER_THRESHOLDS: Record<ReputationTier, number> = {
  Builder: 0,
  Contributor: 12,
  Mentor: 40,
  Core: 120,
}

/** Points still needed for the next tier, or null once at the top. */
export function nextTier(points: number): { tier: ReputationTier; remaining: number } | null {
  for (const tier of TIER_ORDER) {
    if (points < TIER_THRESHOLDS[tier]) {
      return { tier, remaining: TIER_THRESHOLDS[tier] - points }
    }
  }
  return null
}

