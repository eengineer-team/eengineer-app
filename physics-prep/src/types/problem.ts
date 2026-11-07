// Shared content contract. Problem content, the practice UI, the simulators and the
// tutor all depend on these shapes. Change them only in the scaffold.

/** The seven AP Physics C: Mechanics units. */
export type Unit =
  | 'kinematics'
  | 'newtons-laws'
  | 'work-energy-power'
  | 'momentum'
  | 'rotation'
  | 'oscillations'
  | 'gravitation'

export const UNIT_LABELS: Record<Unit, string> = {
  kinematics: 'Kinematics',
  'newtons-laws': 'Newton’s Laws of Motion',
  'work-energy-power': 'Work, Energy and Power',
  momentum: 'Systems of Particles and Linear Momentum',
  rotation: 'Rotation',
  oscillations: 'Oscillations',
  gravitation: 'Gravitation',
}

export const UNIT_ORDER: Unit[] = [
  'kinematics',
  'newtons-laws',
  'work-energy-power',
  'momentum',
  'rotation',
  'oscillations',
  'gravitation',
]

export type Difficulty = 'starter' | 'intermediate' | 'advanced'

/** Numeric answer, checked as |given - value| <= |value| * tolerancePct / 100. */
export interface NumericAnswer {
  kind: 'numeric'
  value: number
  /** SI unit as shown to the student, e.g. "m/s", "N", "J", "rad/s". Empty string for dimensionless. */
  unit: string
  tolerancePct: number
}

export interface ChoiceAnswer {
  kind: 'choice'
  options: string[]
  correctIndex: number
}

export interface SolutionStep {
  title: string
  /** Plain text. Write math with Unicode (v₀, θ, ½, ², √, Δ, ω, α, μ, Σ, ·, ×, ≈). No LaTeX. */
  body: string
}

export interface ProblemPart {
  /** "a", "b", "c" … */
  id: string
  prompt: string
  answer: NumericAnswer | ChoiceAnswer
  hint?: string
  solution: SolutionStep[]
}

/** Presets the simulators understand via the ?preset= query param. */
export type FreeBodyPreset =
  | 'block-on-floor-pulled'
  | 'block-on-incline'
  | 'hanging-mass'
  | 'atwood-machine'
  | 'elevator'
export type MotionPreset = 'projectile' | 'incline' | 'atwood' | 'free-fall' | 'spring'

export type SimulatorLink = { tool: 'fbd'; preset: FreeBodyPreset } | { tool: 'motion'; preset: MotionPreset }

export interface Problem {
  /** Stable slug, e.g. "kin-01". Used in URLs (/practice/kin-01). */
  id: string
  unit: Unit
  difficulty: Difficulty
  title: string
  /** Shared setup for all parts. Plain text with Unicode math. Use g = 9.8 m/s² unless stated. */
  statement: string
  parts: ProblemPart[]
  tags: string[]
  /** true = in the free tier. Non-free problems are shown locked with a Pro prompt. */
  free: boolean
  simulator?: SimulatorLink
}
