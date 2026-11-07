// Pure physics for the motion simulator. No React, no DOM: every function here maps
// parameters (SI units, angles in degrees) to a Simulation that can be sampled at any t.
// Closed-form solutions are used wherever they exist; the damped spring uses fixed-step RK4.

export const G = 9.8
const EPS = 1e-9

const toRad = (deg: number) => (deg * Math.PI) / 180
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Position, velocity and acceleration of one coordinate at one instant. */
export interface Kin {
  p: number
  v: number
  a: number
}

/** A symbol such as vₓ, written as base + optional subscript so the UI can render <sub>. */
export interface Sym {
  base: string
  sub?: string
}

/** One graphable coordinate (e.g. x and y for a projectile). */
export interface ChannelDef {
  key: string
  /** Short toggle label, e.g. "x" or "m₁". */
  short: string
  /** What the coordinate means, including its positive direction. */
  description: string
  pos: Sym
  vel: Sym
  acc: Sym
}

export interface Result {
  label: string
  value: number | string
  unit?: string
}

interface SimBase {
  /** Seconds simulated; playback ends here. */
  duration: number
  /** Times where acceleration jumps; graphs sample on both sides so steps stay sharp. */
  breaks: number[]
  graphSamples: number
  channels: ChannelDef[]
  /** Kinematics of every channel at time t (clamped to [0, duration]). */
  at(t: number): Kin[]
  /** One-line description of what is happening at time t. */
  phase(t: number): string
  /** Extra time-dependent readouts (speed, energy …). */
  live(t: number): Result[]
  results: Result[]
  /** Largest |v| and |a| over the run, used to scale arrows. */
  maxSpeed: number
  maxAccel: number
}

// ---------------------------------------------------------------- projectile

export interface ProjectileParams {
  v0: number
  angleDeg: number
  h0: number
}

export interface ProjectileSim extends SimBase {
  kind: 'projectile'
  params: ProjectileParams
  range: number
  maxHeight: number
  tApex: number
}

export function simulateProjectile(params: ProjectileParams): ProjectileSim {
  const { v0, angleDeg, h0 } = params
  const th = toRad(angleDeg)
  const vx0 = Math.abs(v0 * Math.cos(th)) < EPS ? 0 : v0 * Math.cos(th)
  const vy0 = v0 * Math.sin(th)
  // Positive root of h0 + vy0·t − ½gt² = 0
  const T = (vy0 + Math.sqrt(vy0 * vy0 + 2 * G * h0)) / G
  const tApex = Math.max(0, vy0 / G)
  const maxHeight = vy0 > 0 ? h0 + (vy0 * vy0) / (2 * G) : h0
  const range = vx0 * T
  const vyImpact = vy0 - G * T
  const impactSpeed = Math.hypot(vx0, vyImpact)
  const impactAngle = (Math.atan2(-vyImpact, vx0) * 180) / Math.PI

  const at = (t: number): Kin[] => {
    const tc = clamp(t, 0, T)
    return [
      { p: vx0 * tc, v: vx0, a: 0 },
      { p: h0 + vy0 * tc - 0.5 * G * tc * tc, v: vy0 - G * tc, a: -G },
    ]
  }

  return {
    kind: 'projectile',
    params,
    duration: T,
    breaks: [],
    graphSamples: 300,
    channels: [
      {
        key: 'x',
        short: 'x',
        description: 'Horizontal (x, forward = +)',
        pos: { base: 'x' },
        vel: { base: 'v', sub: 'x' },
        acc: { base: 'a', sub: 'x' },
      },
      {
        key: 'y',
        short: 'y',
        description: 'Vertical (y, up = +)',
        pos: { base: 'y' },
        vel: { base: 'v', sub: 'y' },
        acc: { base: 'a', sub: 'y' },
      },
    ],
    at,
    phase: (t) => {
      if (T <= EPS) return 'Launched along the ground: no flight'
      if (t >= T - EPS) return 'Landed: the motion ends here'
      const vy = at(t)[1].v
      if (Math.abs(vy) < 0.05) return 'At the top: vertical velocity is 0, but vₓ and a = −g remain'
      return vy > 0
        ? 'Rising: vertical velocity drops by 9.8 m/s each second; vₓ stays constant'
        : 'Falling: vertical velocity grows downward; vₓ stays constant'
    },
    live: (t) => {
      const [kx, ky] = at(t)
      return [{ label: 'Speed |v|', value: Math.hypot(kx.v, ky.v), unit: 'm/s' }]
    },
    results: [
      { label: 'Time of flight', value: T, unit: 's' },
      { label: 'Range', value: range, unit: 'm' },
      { label: 'Max height', value: maxHeight, unit: 'm' },
      { label: 'Time to max height', value: tApex, unit: 's' },
      { label: 'Impact speed', value: impactSpeed, unit: 'm/s' },
      { label: 'Impact angle below horizontal', value: impactAngle, unit: '°' },
    ],
    range,
    maxHeight,
    tApex,
    maxSpeed: Math.max(v0, impactSpeed),
    maxAccel: G,
  }
}

// ---------------------------------------------------------------- free fall

export interface FreeFallParams {
  height: number
  /** Initial vertical velocity, up = +. */
  v0: number
}

export interface FreeFallSim extends SimBase {
  kind: 'free-fall'
  params: FreeFallParams
  maxHeight: number
}

export function simulateFreeFall(params: FreeFallParams): FreeFallSim {
  const { height, v0 } = params
  const T = (v0 + Math.sqrt(v0 * v0 + 2 * G * height)) / G
  const vImpact = v0 - G * T
  const maxHeight = v0 > 0 ? height + (v0 * v0) / (2 * G) : height

  const at = (t: number): Kin[] => {
    const tc = clamp(t, 0, T)
    return [{ p: height + v0 * tc - 0.5 * G * tc * tc, v: v0 - G * tc, a: -G }]
  }

  const results: Result[] = [
    { label: 'Time to hit the ground', value: T, unit: 's' },
    { label: 'Impact speed', value: Math.abs(vImpact), unit: 'm/s' },
    { label: 'Max height', value: maxHeight, unit: 'm' },
  ]
  if (v0 > 0) results.push({ label: 'Time to reach the top', value: v0 / G, unit: 's' })

  return {
    kind: 'free-fall',
    params,
    duration: T,
    breaks: [],
    graphSamples: 300,
    channels: [
      {
        key: 'y',
        short: 'y',
        description: 'Height above the ground (up = +)',
        pos: { base: 'y' },
        vel: { base: 'v', sub: 'y' },
        acc: { base: 'a', sub: 'y' },
      },
    ],
    at,
    phase: (t) => {
      if (t >= T - EPS) return 'Hits the ground'
      const v = at(t)[0].v
      if (Math.abs(v) < 0.05) return 'Momentarily at rest at the top, yet a = −g still'
      return v > 0 ? 'Rising: velocity up, acceleration down, so it slows' : 'Falling: velocity and acceleration both down, so it speeds up'
    },
    live: () => [],
    results,
    maxHeight,
    maxSpeed: Math.max(Math.abs(v0), Math.abs(vImpact)),
    maxAccel: G,
  }
}

// ---------------------------------------------------------------- incline

export interface InclineParams {
  angleDeg: number
  mu: number
  /** Initial speed (always ≥ 0); its direction is given by `direction`. */
  v0: number
  direction: 'up' | 'down'
  /** Length of the ramp along the slope. */
  length: number
}

interface Segment {
  t0: number
  t1: number
  s0: number
  v0: number
  a: number
  label: string
}

export interface InclineSim extends SimBase {
  kind: 'incline'
  params: InclineParams
}

function evalSegments(segs: Segment[], t: number): { kin: Kin; seg: Segment } {
  let seg = segs[0]
  for (const s of segs) if (t >= s.t0) seg = s
  const dt = clamp(t, seg.t0, seg.t1) - seg.t0
  return { kin: { p: seg.s0 + seg.v0 * dt + 0.5 * seg.a * dt * dt, v: seg.v0 + seg.a * dt, a: seg.a }, seg }
}

const INCLINE_LABEL = {
  up: 'Sliding up: gravity (mg sin θ) and kinetic friction both act down the slope',
  down: 'Sliding down: kinetic friction acts up the slope, against the motion',
  holds: 'At rest: static friction holds the block because μ ≥ tan θ',
  bottom: 'At rest at the bottom of the ramp',
}

/** s = distance along the ramp measured from the bottom, up the slope = +. Assumes μs = μk. */
export function simulateIncline(params: InclineParams): InclineSim {
  const { angleDeg, mu, v0, direction, length: L } = params
  const th = toRad(angleDeg)
  const sin = Math.sin(th)
  const cos = Math.cos(th)
  const tan = Math.tan(th)
  const aUp = -G * (sin + mu * cos) // while moving up the slope
  const aDown = -G * (sin - mu * cos) // while moving down (negative = speeds up downhill)
  const canSlip = tan > mu + EPS

  const segs: Segment[] = []
  const results: Result[] = [
    { label: 'tan θ (compare with μ)', value: tan },
  ]
  let endLabel: string | undefined

  if (direction === 'up') {
    results.push({ label: 'Acceleration sliding up (up-slope +)', value: aUp, unit: 'm/s²' })
    if (v0 <= EPS) {
      segs.push({ t0: 0, t1: 2, s0: 0, v0: 0, a: 0, label: INCLINE_LABEL.bottom })
    } else {
      const tStop = v0 / -aUp
      const dStop = (v0 * v0) / (2 * -aUp)
      if (dStop >= L) {
        // Leaves the top of the ramp before it can stop: s(t) = L
        const tTop = (v0 - Math.sqrt(Math.max(0, v0 * v0 + 2 * aUp * L))) / -aUp
        segs.push({ t0: 0, t1: tTop, s0: 0, v0, a: aUp, label: INCLINE_LABEL.up })
        endLabel = 'Reaches the top of the ramp while still moving'
        results.push(
          { label: 'Time to reach the top', value: tTop, unit: 's' },
          { label: 'Speed at the top', value: v0 + aUp * tTop, unit: 'm/s' },
        )
      } else {
        segs.push({ t0: 0, t1: tStop, s0: 0, v0, a: aUp, label: INCLINE_LABEL.up })
        results.push(
          { label: 'Time to stop', value: tStop, unit: 's' },
          { label: 'Distance up the slope', value: dStop, unit: 'm' },
        )
        if (canSlip) {
          const t2 = Math.sqrt((2 * dStop) / -aDown)
          segs.push({ t0: tStop, t1: tStop + t2, s0: dStop, v0: 0, a: aDown, label: INCLINE_LABEL.down })
          endLabel = 'Back at the bottom of the ramp'
          results.push(
            { label: 'After stopping', value: 'Slides back (tan θ > μ)' },
            { label: 'Acceleration sliding down (up-slope +)', value: aDown, unit: 'm/s²' },
            { label: 'Time to slide back', value: t2, unit: 's' },
            { label: 'Speed back at the bottom', value: -aDown * t2, unit: 'm/s' },
          )
        } else {
          segs.push({ t0: tStop, t1: tStop + Math.max(1, tStop), s0: dStop, v0: 0, a: 0, label: INCLINE_LABEL.holds })
          results.push({ label: 'After stopping', value: 'Stays put (μ ≥ tan θ)' })
        }
      }
    }
  } else {
    results.push({ label: 'Acceleration sliding down (up-slope +)', value: aDown, unit: 'm/s²' })
    const still = v0 <= EPS && (!canSlip || Math.abs(aDown) <= EPS)
    if (still) {
      segs.push({ t0: 0, t1: 2, s0: L, v0: 0, a: 0, label: INCLINE_LABEL.holds })
      results.push({ label: 'Outcome', value: 'Never starts moving (μ ≥ tan θ)' })
    } else if (aDown > EPS) {
      // μ > tan θ: friction wins, the block decelerates on the way down
      const dStop = (v0 * v0) / (2 * aDown)
      if (dStop < L) {
        const tStop = v0 / aDown
        segs.push({ t0: 0, t1: tStop, s0: L, v0: -v0, a: aDown, label: INCLINE_LABEL.down })
        segs.push({ t0: tStop, t1: tStop + Math.max(1, tStop), s0: L - dStop, v0: 0, a: 0, label: INCLINE_LABEL.holds })
        results.push(
          { label: 'Time to stop', value: tStop, unit: 's' },
          { label: 'Distance slid', value: dStop, unit: 'm' },
          { label: 'Outcome', value: 'Stops and stays (μ > tan θ)' },
        )
      } else {
        const tB = (v0 - Math.sqrt(Math.max(0, v0 * v0 - 2 * aDown * L))) / aDown
        segs.push({ t0: 0, t1: tB, s0: L, v0: -v0, a: aDown, label: INCLINE_LABEL.down })
        endLabel = 'Reaches the bottom of the ramp'
        results.push(
          { label: 'Time to reach the bottom', value: tB, unit: 's' },
          { label: 'Speed at the bottom', value: v0 - aDown * tB, unit: 'm/s' },
        )
      }
    } else {
      // Constant speed (μ = tan θ) or speeding up (μ < tan θ)
      const tB = Math.abs(aDown) <= EPS ? L / v0 : (-v0 + Math.sqrt(v0 * v0 - 2 * aDown * L)) / -aDown
      segs.push({ t0: 0, t1: tB, s0: L, v0: -v0, a: aDown, label: INCLINE_LABEL.down })
      endLabel = 'Reaches the bottom of the ramp'
      results.push(
        { label: 'Time to reach the bottom', value: tB, unit: 's' },
        { label: 'Speed at the bottom', value: v0 - aDown * tB, unit: 'm/s' },
      )
    }
  }

  const duration = segs[segs.length - 1].t1
  let maxSpeed = 0
  let maxAccel = 0
  for (const s of segs) {
    maxSpeed = Math.max(maxSpeed, Math.abs(s.v0), Math.abs(s.v0 + s.a * (s.t1 - s.t0)))
    maxAccel = Math.max(maxAccel, Math.abs(s.a))
  }

  return {
    kind: 'incline',
    params,
    duration,
    breaks: segs.slice(1).map((s) => s.t0),
    graphSamples: 300,
    channels: [
      {
        key: 's',
        short: 's',
        description: 'Distance along the ramp from the bottom (up the slope = +)',
        pos: { base: 's' },
        vel: { base: 'v' },
        acc: { base: 'a' },
      },
    ],
    at: (t) => [evalSegments(segs, t).kin],
    phase: (t) => (endLabel && t >= duration - EPS ? endLabel : evalSegments(segs, t).seg.label),
    live: () => [],
    results,
    maxSpeed,
    maxAccel,
  }
}

// ---------------------------------------------------------------- Atwood machine

export interface AtwoodParams {
  m1: number
  m2: number
}

/** Both masses start with their bottoms this high; the descending one falls this far. */
export const ATWOOD_START_HEIGHT = 2
export const ATWOOD_TRAVEL = 2

export interface AtwoodSim extends SimBase {
  kind: 'atwood'
  params: AtwoodParams
  /** Acceleration of m₁, up = +. */
  a1: number
  tension: number
}

export function simulateAtwood(params: AtwoodParams): AtwoodSim {
  const { m1, m2 } = params
  const a1 = ((m2 - m1) * G) / (m1 + m2)
  const tension = (2 * m1 * m2 * G) / (m1 + m2)
  const balanced = Math.abs(a1) < EPS
  const T = balanced ? 3 : Math.sqrt((2 * ATWOOD_TRAVEL) / Math.abs(a1))
  const heavier = m2 > m1 ? 'm₂' : 'm₁'
  const lighter = m2 > m1 ? 'm₁' : 'm₂'

  const at = (t: number): Kin[] => {
    const tc = clamp(t, 0, T)
    const y = 0.5 * a1 * tc * tc
    const v = a1 * tc
    return [
      { p: y, v, a: a1 },
      { p: -y, v: -v, a: -a1 },
    ]
  }

  const results: Result[] = [
    { label: 'Acceleration |a| = |m₂ − m₁|g / (m₁ + m₂)', value: Math.abs(a1), unit: 'm/s²' },
    { label: 'String tension', value: tension, unit: 'N' },
    { label: 'Weight of m₁', value: m1 * G, unit: 'N' },
    { label: 'Weight of m₂', value: m2 * G, unit: 'N' },
  ]
  if (!balanced) {
    results.push(
      { label: `Time for ${heavier} to fall ${ATWOOD_TRAVEL} m`, value: T, unit: 's' },
      { label: 'Speed when it lands', value: Math.abs(a1) * T, unit: 'm/s' },
    )
  }

  return {
    kind: 'atwood',
    params,
    duration: T,
    breaks: [],
    graphSamples: 300,
    channels: [
      {
        key: 'm1',
        short: 'm₁',
        description: 'Height of m₁ above its start (up = +)',
        pos: { base: 'y', sub: '1' },
        vel: { base: 'v', sub: '1' },
        acc: { base: 'a', sub: '1' },
      },
      {
        key: 'm2',
        short: 'm₂',
        description: 'Height of m₂ above its start (up = +)',
        pos: { base: 'y', sub: '2' },
        vel: { base: 'v', sub: '2' },
        acc: { base: 'a', sub: '2' },
      },
    ],
    at,
    phase: (t) => {
      if (balanced) return 'Equal masses: net force is zero, so they stay at rest'
      if (t >= T - EPS) return `${heavier} reaches the floor`
      return `${heavier} accelerates down, ${lighter} accelerates up at the same rate (tension ${tension.toFixed(1)} N)`
    },
    live: () => [],
    results,
    a1,
    tension,
    maxSpeed: Math.abs(a1) * T,
    maxAccel: Math.abs(a1),
  }
}

// ---------------------------------------------------------------- spring (RK4)

export interface SpringParams {
  k: number
  m: number
  amplitude: number
  /** Linear damping coefficient, force = −b·v. */
  b: number
}

export interface SpringSim extends SimBase {
  kind: 'spring'
  params: SpringParams
  period: number
}

/** Integrates m·x″ = −k·x − b·x′ with classic fixed-step RK4. Exported for testing. */
export function integrateSpring(k: number, m: number, b: number, x0: number, v0: number, dt: number, steps: number) {
  const xs = new Float64Array(steps + 1)
  const vs = new Float64Array(steps + 1)
  const acc = (x: number, v: number) => -(k * x + b * v) / m
  let x = x0
  let v = v0
  for (let i = 0; i <= steps; i++) {
    xs[i] = x
    vs[i] = v
    const k1x = v
    const k1v = acc(x, v)
    const k2x = v + 0.5 * dt * k1v
    const k2v = acc(x + 0.5 * dt * k1x, v + 0.5 * dt * k1v)
    const k3x = v + 0.5 * dt * k2v
    const k3v = acc(x + 0.5 * dt * k2x, v + 0.5 * dt * k2v)
    const k4x = v + dt * k3v
    const k4v = acc(x + dt * k3x, v + dt * k3v)
    x += (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x)
    v += (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v)
  }
  return { xs, vs }
}

/** Cubic Hermite between two samples using their derivatives (keeps curves smooth between steps). */
function hermite(p0: number, m0: number, p1: number, m1: number, h: number, s: number) {
  const s2 = s * s
  const s3 = s2 * s
  return (2 * s3 - 3 * s2 + 1) * p0 + (s3 - 2 * s2 + s) * h * m0 + (-2 * s3 + 3 * s2) * p1 + (s3 - s2) * h * m1
}

export function simulateSpring(params: SpringParams): SpringSim {
  const { k, m, amplitude: A, b } = params
  const omega0 = Math.sqrt(k / m)
  const T0 = (2 * Math.PI) / omega0
  const zeta = b / (2 * Math.sqrt(k * m))
  const duration = clamp(4 * T0, 4, 30)
  // Step small against both the period and the damping time m/b so RK4 stays accurate.
  let dt = Math.min(T0 / 200, duration / 1000)
  if (b > 0) dt = Math.min(dt, (0.2 * m) / b)
  const steps = Math.ceil(duration / dt)
  dt = duration / steps
  const { xs, vs } = integrateSpring(k, m, b, A, 0, dt, steps)
  const accel = (x: number, v: number) => -(k * x + b * v) / m

  const at = (t: number): Kin[] => {
    const tc = clamp(t, 0, duration)
    const i = Math.min(steps - 1, Math.floor(tc / dt))
    const s = tc / dt - i
    const x = hermite(xs[i], vs[i], xs[i + 1], vs[i + 1], dt, s)
    const v = hermite(vs[i], accel(xs[i], vs[i]), vs[i + 1], accel(xs[i + 1], vs[i + 1]), dt, s)
    return [{ p: x, v, a: accel(x, v) }]
  }

  let maxSpeed = 0
  let maxAccel = 0
  for (let i = 0; i <= steps; i++) {
    maxSpeed = Math.max(maxSpeed, Math.abs(vs[i]))
    maxAccel = Math.max(maxAccel, Math.abs(accel(xs[i], vs[i])))
  }

  const regime =
    b === 0 ? 'Undamped (simple harmonic)' : zeta < 1 - 1e-6 ? 'Underdamped' : zeta <= 1 + 1e-6 ? 'Critically damped' : 'Overdamped'

  const results: Result[] = [
    { label: b === 0 ? 'Period T = 2π√(m/k)' : 'Undamped period 2π√(m/k)', value: T0, unit: 's' },
    { label: 'Angular frequency ω = √(k/m)', value: omega0, unit: 'rad/s' },
    { label: 'Frequency f = 1/T', value: 1 / T0, unit: 'Hz' },
    { label: 'Initial energy ½kA²', value: 0.5 * k * A * A, unit: 'J' },
  ]
  if (b === 0) {
    results.push({ label: 'Max speed Aω', value: A * omega0, unit: 'm/s' })
  } else {
    results.push({ label: 'Damping ratio ζ = b / (2√(km))', value: zeta }, { label: 'Motion type', value: regime })
    if (zeta < 1 - 1e-6) {
      results.push({ label: 'Damped period', value: (2 * Math.PI) / (omega0 * Math.sqrt(1 - zeta * zeta)), unit: 's' })
    }
  }

  return {
    kind: 'spring',
    params,
    duration,
    breaks: [],
    graphSamples: clamp(Math.round((duration / T0) * 60), 400, 2400),
    channels: [
      {
        key: 'x',
        short: 'x',
        description: 'Displacement from equilibrium (right = +)',
        pos: { base: 'x' },
        vel: { base: 'v' },
        acc: { base: 'a' },
      },
    ],
    at,
    phase: (t) => {
      const { p, v } = at(t)[0]
      const scale = Math.max(A, 1e-6)
      if (Math.abs(p) < 0.01 * scale) return 'Passing equilibrium: spring force is zero, speed is at its peak'
      const pull = p > 0 ? 'right of equilibrium, so the spring pulls left' : 'left of equilibrium, so the spring pushes right'
      const motion = Math.abs(v) < 0.01 * scale * omega0 ? 'momentarily at rest' : p * v < 0 ? 'speeding up' : 'slowing down'
      return `Block is ${pull}; ${motion}`
    },
    live: (t) => {
      const { p, v } = at(t)[0]
      const ke = 0.5 * m * v * v
      const pe = 0.5 * k * p * p
      return [
        { label: 'Kinetic energy ½mv²', value: ke, unit: 'J' },
        { label: 'Spring energy ½kx²', value: pe, unit: 'J' },
        { label: 'Total mechanical energy', value: ke + pe, unit: 'J' },
      ]
    },
    results,
    period: T0,
    maxSpeed,
    maxAccel,
  }
}

// ---------------------------------------------------------------- shared

export type Simulation = ProjectileSim | FreeFallSim | InclineSim | AtwoodSim | SpringSim

export interface SeriesData {
  times: number[]
  /** values[channel][quantity 0 = p, 1 = v, 2 = a][sample] */
  values: number[][][]
}

/** Samples every channel for the graphs, adding points just before each acceleration jump. */
export function sampleSimulation(sim: Simulation): SeriesData {
  const T = sim.duration
  const n = sim.graphSamples
  const times: number[] = []
  if (T <= EPS) times.push(0)
  else {
    for (let i = 0; i <= n; i++) times.push((T * i) / n)
    for (const b of sim.breaks) {
      if (b > 0 && b < T) times.push(Math.max(0, b - T * 1e-6), b)
    }
    times.sort((a, b) => a - b)
  }
  const values = sim.channels.map(() => [[], [], []] as number[][])
  for (const t of times) {
    sim.at(t).forEach((k, c) => {
      values[c][0].push(k.p)
      values[c][1].push(k.v)
      values[c][2].push(k.a)
    })
  }
  return { times, values }
}
