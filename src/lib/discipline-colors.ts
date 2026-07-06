// Functional discipline color-coding — NOT decoration. Every place that shows
// a discipline (Community chips, profiles, calendar deadlines, sidebar clubs)
// should route through this helper instead of picking a color by hand, so the
// same discipline always reads as the same color everywhere.
//
// The actual hex values live in tailwind.config.js under `colors.discipline`
// (muted/desaturated set, tuned to sit calmly on dark-900) — this file only
// maps free-form labels to that token set and returns class names.

const DISCIPLINE_KEYS = [
  'aerospace',
  'mechanical',
  'electrical',
  'software',
  'civil',
  'chemical',
  'biomedical',
  'materials',
  'environmental',
] as const

type DisciplineKey = (typeof DISCIPLINE_KEYS)[number] | 'other'

export interface DisciplineColorClasses {
  /** Solid dot — leading indicator on chips/clubs/calendar entries. */
  dot: string
  /** Thin border tint for chips. */
  border: string
  /** Text tint, for the rare case a label itself should carry the color. */
  text: string
}

// Calendar/opportunity data sometimes uses compound labels ("Robotics /
// Aerospace", "All disciplines") rather than the exact Discipline union, so
// this matches by substring and falls back to 'other' rather than rendering
// an untinted (and therefore meaningless) chip.
function resolveKey(label: string): DisciplineKey {
  const normalized = label.toLowerCase()
  return DISCIPLINE_KEYS.find((key) => normalized.includes(key)) ?? 'other'
}

export function getDisciplineColor(label: string): DisciplineColorClasses {
  const key = resolveKey(label)
  return {
    dot: `bg-discipline-${key}`,
    border: `border-discipline-${key}`,
    text: `text-discipline-${key}`,
  }
}
