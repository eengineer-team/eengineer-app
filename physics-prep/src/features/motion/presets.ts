import type { MotionPreset } from '@/types/problem'
import {
  simulateAtwood,
  simulateFreeFall,
  simulateIncline,
  simulateProjectile,
  simulateSpring,
  type AtwoodParams,
  type FreeFallParams,
  type InclineParams,
  type ProjectileParams,
  type Simulation,
  type SpringParams,
} from './physics'

export interface ParamsByPreset {
  projectile: ProjectileParams
  incline: InclineParams
  atwood: AtwoodParams
  'free-fall': FreeFallParams
  spring: SpringParams
}

type NumericKeys<P> = { [K in keyof P]: P[K] extends number ? K : never }[keyof P]

export interface NumberField<P> {
  key: NumericKeys<P> & string
  label: string
  symbol: string
  unit: string
  min: number
  max: number
  step: number
  hint?: string
}

export const PRESET_ORDER: MotionPreset[] = ['projectile', 'incline', 'atwood', 'free-fall', 'spring']

export function isMotionPreset(v: string | null): v is MotionPreset {
  return v !== null && (PRESET_ORDER as string[]).includes(v)
}

export const PRESET_INFO: Record<MotionPreset, { title: string; notice: string[] }> = {
  projectile: {
    title: 'Projectile',
    notice: [
      'vₓ never changes: there is no horizontal force once the ball is launched.',
      'The vertical acceleration is −9.8 m/s² the whole flight, including at the top where the vertical velocity is zero.',
      'Launching from level ground, 45° gives the longest range. From a height, the best angle is a little lower.',
    ],
  },
  incline: {
    title: 'Incline',
    notice: [
      'Going up, gravity and friction both point down the slope, so the block slows quickly.',
      'Coming down, friction flips direction, so the acceleration is smaller: a = g(sin θ − μ cos θ).',
      'With μs = μk, a block that stops slides back only if tan θ > μ. Try θ = 15° with μ = 0.3.',
    ],
  },
  atwood: {
    title: 'Atwood machine',
    notice: [
      'Treat both masses as one system: the net force (m₂ − m₁)g accelerates the total mass m₁ + m₂.',
      'The tension sits between the two weights. It is never equal to the heavier weight while things accelerate.',
      'Make the masses equal and the acceleration drops to zero.',
    ],
  },
  'free-fall': {
    title: 'Free fall',
    notice: [
      'Position is a parabola, velocity is a straight line with slope −g, and acceleration is flat.',
      'Give it an upward v₀: velocity passes through zero at the top, but the acceleration stays −9.8 m/s².',
      'Impact speed depends only on height and v₀: v² = v₀² + 2gh.',
    ],
  },
  spring: {
    title: 'Spring',
    notice: [
      'x and a are always opposite in sign: a = −(k/m)x for an undamped spring.',
      'Speed peaks at equilibrium and drops to zero at the turning points.',
      'The period depends on m and k, not on amplitude. Add damping b and watch the total energy fall.',
    ],
  },
}

export const DEFAULT_PARAMS: ParamsByPreset = {
  projectile: { v0: 20, angleDeg: 55, h0: 0 },
  incline: { angleDeg: 30, mu: 0.2, v0: 6, direction: 'up', length: 10 },
  atwood: { m1: 2, m2: 3 },
  'free-fall': { height: 20, v0: 0 },
  spring: { k: 20, m: 0.5, amplitude: 0.3, b: 0 },
}

export const FIELDS: { [K in MotionPreset]: NumberField<ParamsByPreset[K]>[] } = {
  projectile: [
    { key: 'v0', label: 'Launch speed', symbol: 'v₀', unit: 'm/s', min: 1, max: 40, step: 0.5 },
    { key: 'angleDeg', label: 'Launch angle', symbol: 'θ', unit: '°', min: 0, max: 90, step: 1 },
    { key: 'h0', label: 'Launch height', symbol: 'h', unit: 'm', min: 0, max: 50, step: 0.5 },
  ],
  incline: [
    { key: 'angleDeg', label: 'Ramp angle', symbol: 'θ', unit: '°', min: 5, max: 60, step: 1 },
    { key: 'mu', label: 'Friction coefficient', symbol: 'μ', unit: '', min: 0, max: 1, step: 0.01, hint: 'μs = μk' },
    { key: 'v0', label: 'Initial speed', symbol: 'v₀', unit: 'm/s', min: 0, max: 15, step: 0.1 },
    { key: 'length', label: 'Ramp length', symbol: 'L', unit: 'm', min: 2, max: 30, step: 0.5 },
  ],
  atwood: [
    { key: 'm1', label: 'Left mass', symbol: 'm₁', unit: 'kg', min: 0.1, max: 10, step: 0.1 },
    { key: 'm2', label: 'Right mass', symbol: 'm₂', unit: 'kg', min: 0.1, max: 10, step: 0.1 },
  ],
  'free-fall': [
    { key: 'height', label: 'Drop height', symbol: 'h', unit: 'm', min: 1, max: 100, step: 0.5 },
    { key: 'v0', label: 'Initial velocity (up = +)', symbol: 'v₀', unit: 'm/s', min: -20, max: 20, step: 0.5 },
  ],
  spring: [
    { key: 'k', label: 'Spring constant', symbol: 'k', unit: 'N/m', min: 1, max: 200, step: 1 },
    { key: 'm', label: 'Mass', symbol: 'm', unit: 'kg', min: 0.1, max: 10, step: 0.1 },
    { key: 'amplitude', label: 'Amplitude', symbol: 'A', unit: 'm', min: 0.05, max: 1, step: 0.01 },
    { key: 'b', label: 'Damping (optional)', symbol: 'b', unit: 'kg/s', min: 0, max: 10, step: 0.05, hint: 'drag force −bv' },
  ],
}

export function buildSimulation(preset: MotionPreset, params: ParamsByPreset): Simulation {
  switch (preset) {
    case 'projectile':
      return simulateProjectile(params.projectile)
    case 'incline':
      return simulateIncline(params.incline)
    case 'atwood':
      return simulateAtwood(params.atwood)
    case 'free-fall':
      return simulateFreeFall(params['free-fall'])
    case 'spring':
      return simulateSpring(params.spring)
  }
}
