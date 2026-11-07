import { Lock, SignalHigh, SignalLow, SignalMedium } from 'lucide-react'
import type { Difficulty } from '@/types/problem'

export const DIFFICULTY_ORDER: Difficulty[] = ['starter', 'intermediate', 'advanced']

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  starter: 'Starter',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

const DIFFICULTY_ICONS = { starter: SignalLow, intermediate: SignalMedium, advanced: SignalHigh }

/** Difficulty shown as a signal-strength icon plus a word, so it never relies on color alone. */
export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const Icon = DIFFICULTY_ICONS[difficulty]
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted">
      <Icon size={13} aria-hidden="true" className="-mt-px" />
      {DIFFICULTY_LABELS[difficulty]}
    </span>
  )
}

export function ProBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
      <Lock size={11} aria-hidden="true" />
      Pro
    </span>
  )
}

export function TagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
      {tags.map((t) => (
        <li key={t} className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-[11px] leading-tight text-muted">
          {t}
        </li>
      ))}
    </ul>
  )
}
