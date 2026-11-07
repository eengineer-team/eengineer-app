// Force vocabulary and angle helpers for the free-body diagram builder.
// Angles are in degrees, measured counterclockwise from +x (pointing right), like a unit circle.

export type ForceType =
  | 'gravity'
  | 'normal'
  | 'tension'
  | 'kinetic-friction'
  | 'static-friction'
  | 'applied'
  | 'spring'

export interface ForceInfo {
  name: string
  /** Default arrow label. "_" marks the start of a subscript (F_N renders as F with subscript N). */
  label: string
  blurb: string
}

export const FORCE_INFO: Record<ForceType, ForceInfo> = {
  gravity: { name: 'Gravity', label: 'F_g', blurb: 'Earth pulls the object' },
  normal: { name: 'Normal force', label: 'F_N', blurb: 'A surface pushes back' },
  tension: { name: 'Tension', label: 'F_T', blurb: 'A rope or cable pulls' },
  'kinetic-friction': { name: 'Kinetic friction', label: 'f_k', blurb: 'Surface resists sliding' },
  'static-friction': { name: 'Static friction', label: 'f_s', blurb: 'Surface prevents slipping' },
  applied: { name: 'Applied push', label: 'F_app', blurb: 'Something pushes directly' },
  spring: { name: 'Spring force', label: 'F_sp', blurb: 'A stretched or squeezed spring' },
}

export const FORCE_ORDER: ForceType[] = [
  'gravity',
  'normal',
  'tension',
  'kinetic-friction',
  'static-friction',
  'applied',
  'spring',
]

/** A force the student has placed on the diagram. */
export interface PlacedForce {
  id: string
  type: ForceType
  /** Degrees counterclockwise from +x, always a multiple of ANGLE_STEP, in [0, 360). */
  angle: number
  /** Qualitative arrow length in diagram units (LENGTH_MIN..LENGTH_MAX). */
  length: number
  label: string
}

export const ANGLE_STEP = 15
export const LENGTH_MIN = 40
export const LENGTH_MAX = 170
export const LENGTH_DEFAULT = 100

export function normalizeAngle(deg: number): number {
  const a = deg % 360
  return a < 0 ? a + 360 : a
}

export function snapAngle(deg: number): number {
  return normalizeAngle(Math.round(deg / ANGLE_STEP) * ANGLE_STEP)
}

/** Smallest unsigned difference between two directions, 0..180. */
export function angleDiff(a: number, b: number): number {
  const d = Math.abs(normalizeAngle(a) - normalizeAngle(b))
  return d > 180 ? 360 - d : d
}

export function clampLength(len: number): number {
  return Math.min(LENGTH_MAX, Math.max(LENGTH_MIN, len))
}

export function lengthWord(len: number): string {
  if (len < 75) return 'short'
  if (len < 125) return 'medium'
  return 'long'
}

/** Plain-language compass description of an angle, used for screen readers and the inspector. */
export function directionWord(deg: number): string {
  const names = ['right', 'up-right', 'up', 'up-left', 'left', 'down-left', 'down', 'down-right']
  return names[Math.round(normalizeAngle(deg) / 45) % 8]
}

/** Labels that describe things that are not forces at all (classic misconceptions). */
const NET_FORCE = /(^|[^a-z])(net|sum)([^a-z]|$)|(^|[^a-z])m\s*\*?\s*a([^a-z]|$)/i
const MOTION_FORCE = /motion|moving|inertia|momentum|velocity|speed|centripetal|acceleration/i

export type Misconception = 'net' | 'motion'

export function labelMisconception(label: string): Misconception | null {
  const l = label.trim()
  if (MOTION_FORCE.test(l)) return 'motion'
  if (NET_FORCE.test(l)) return 'net'
  return null
}
