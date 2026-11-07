import type { ReactNode } from 'react'
import { fmtFixed, niceStep, tickLabel, ticks } from './format'
import { useElementWidth } from './hooks'
import {
  ATWOOD_START_HEIGHT,
  ATWOOD_TRAVEL,
  G,
  type AtwoodSim,
  type FreeFallSim,
  type InclineSim,
  type ProjectileSim,
  type Simulation,
  type SpringSim,
} from './physics'

// Animated SVG scenes. Each draws at real pixel size (measured width) and maps world
// metres to pixels with one uniform scale, so distances are to scale.

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

interface Pad {
  l: number
  r: number
  t: number
  b: number
}

interface Fit {
  k: number
  X: (x: number) => number
  Y: (y: number) => number
  invX: (px: number) => number
  invY: (py: number) => number
}

/** Uniform world→pixel map. World y = b.y0 sits on the bottom padding line. */
function fitWorld(b: { x0: number; x1: number; y0: number; y1: number }, W: number, H: number, pad: Pad, alignX: 'start' | 'center'): Fit {
  const bw = Math.max(b.x1 - b.x0, 1e-6)
  const bh = Math.max(b.y1 - b.y0, 1e-6)
  const aw = Math.max(10, W - pad.l - pad.r)
  const ah = Math.max(10, H - pad.t - pad.b)
  const k = Math.min(aw / bw, ah / bh)
  const ox = pad.l + (alignX === 'center' ? (aw - bw * k) / 2 : 0)
  const baseY = H - pad.b
  return {
    k,
    X: (x) => ox + (x - b.x0) * k,
    Y: (y) => baseY - (y - b.y0) * k,
    invX: (px) => b.x0 + (px - ox) / k,
    invY: (py) => b.y0 + (baseY - py) / k,
  }
}

function SceneFrame({ label, height, children }: { label: string; height: (w: number) => number; children: (W: number, H: number) => ReactNode }) {
  const [ref, W] = useElementWidth<HTMLDivElement>()
  const H = Math.round(height(W))
  return (
    <div ref={ref} className="w-full" style={{ minHeight: H }}>
      {W > 0 && (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="block select-none">
          {children(W, H)}
        </svg>
      )}
    </div>
  )
}

type Tone = 'velocity' | 'accel'
const TONE_CLASS: Record<Tone, { stroke: string; fill: string }> = {
  velocity: { stroke: 'stroke-velocity', fill: 'fill-velocity' },
  accel: { stroke: 'stroke-accel', fill: 'fill-accel' },
}

/** Arrow from (x, y) by (dx, dy) in screen pixels, with a drawn head (markers can't inherit theme colors). */
function Arrow({ x, y, dx, dy, tone, label, faint }: { x: number; y: number; dx: number; dy: number; tone: Tone; label?: string; faint?: boolean }) {
  const len = Math.hypot(dx, dy)
  if (len < 3) return null
  const ux = dx / len
  const uy = dy / len
  const head = Math.min(faint ? 7 : 10, len * 0.6)
  const w = head * 0.55
  const bx = x + dx - ux * head
  const by = y + dy - uy * head
  const c = TONE_CLASS[tone]
  return (
    <g opacity={faint ? 0.45 : 1}>
      <line x1={x} y1={y} x2={bx} y2={by} className={c.stroke} strokeWidth={faint ? 1.5 : 2.75} strokeLinecap="round" />
      <polygon points={`${x + dx},${y + dy} ${bx - uy * w},${by + ux * w} ${bx + uy * w},${by - ux * w}`} className={c.fill} />
      {label && (
        <text
          x={x + dx + ux * 11}
          y={y + dy + uy * 11}
          textAnchor="middle"
          dominantBaseline="middle"
          className={`${c.fill} font-mono text-[12px] font-semibold italic`}
        >
          {label}
        </text>
      )}
    </g>
  )
}

function Ground({ x0, x1, y }: { x0: number; x1: number; y: number }) {
  const hatches: ReactNode[] = []
  for (let x = x0 + 4; x < x1; x += 10) {
    hatches.push(<line key={x} x1={x} y1={y + 1} x2={x - 7} y2={y + 8} className="stroke-border" strokeWidth={1} />)
  }
  return (
    <g>
      {hatches}
      <line x1={x0} x2={x1} y1={y} y2={y} className="stroke-muted" strokeWidth={1.5} />
    </g>
  )
}

/** px per (m/s) and px per (m/s²) so the largest arrow of the run is `maxPx` long. */
function arrowScales(sim: Simulation, maxPx: number) {
  return {
    sv: sim.maxSpeed > 1e-9 ? maxPx / sim.maxSpeed : 0,
    sa: sim.maxAccel > 1e-9 ? (0.75 * maxPx) / sim.maxAccel : 0,
  }
}

const AXIS_TEXT = 'fill-muted font-mono text-[10px]'

// ---------------------------------------------------------------- projectile

export function ProjectileScene({ sim, t, label }: { sim: ProjectileSim; t: number; label: string }) {
  return (
    <SceneFrame label={label} height={(w) => clamp(w * 0.55, 230, 380)}>
      {(W, H) => {
        const T = sim.duration
        const pad = { l: 58, r: 18, t: 24, b: 32 }
        const f = fitWorld({ x0: 0, x1: Math.max(sim.range, 1), y0: 0, y1: Math.max(sim.maxHeight, 1) }, W, H, pad, 'start')
        const [kx, ky] = sim.at(t)
        const bx = f.X(kx.p)
        const by = f.Y(ky.p)
        const { sv, sa } = arrowScales(sim, clamp(Math.min(W, H) * 0.24, 50, 95))

        const pathPts = (tEnd: number) => {
          const n = 90
          const pts: string[] = []
          for (let i = 0; i <= n; i++) {
            const [a, b] = sim.at((tEnd * i) / n)
            pts.push(`${f.X(a.p).toFixed(1)},${f.Y(b.p).toFixed(1)}`)
          }
          return pts.join(' ')
        }
        const strobeDt = niceStep(Math.max(T, 1e-3), 8)
        const strobes: ReactNode[] = []
        for (let s = strobeDt; s < t - 1e-9; s += strobeDt) {
          const [a, b] = sim.at(s)
          strobes.push(<circle key={s} cx={f.X(a.p)} cy={f.Y(b.p)} r={3.5} className="fill-muted/40" />)
        }
        const xT = ticks(0, f.invX(W - pad.r), W < 420 ? 4 : 7)
        const yT = ticks(0, f.invY(pad.t), 4)
        const axisX = f.X(0) - 18

        return (
          <>
            <Ground x0={0} x1={W} y={f.Y(0)} />
            {sim.params.h0 > 0 && (
              <rect x={f.X(0) - 14} y={f.Y(sim.params.h0)} width={14} height={f.Y(0) - f.Y(sim.params.h0)} className="fill-surface2 stroke-border" />
            )}
            {/* axes */}
            <line x1={axisX} x2={axisX} y1={f.Y(0)} y2={pad.t - 6} className="stroke-muted" strokeWidth={1} />
            {yT.values.map((v) => (
              <g key={`y${v}`}>
                <line x1={axisX - 4} x2={axisX} y1={f.Y(v)} y2={f.Y(v)} className="stroke-muted" />
                <text x={axisX - 6} y={f.Y(v)} textAnchor="end" dominantBaseline="middle" className={AXIS_TEXT}>
                  {tickLabel(v, yT.step)}
                </text>
              </g>
            ))}
            <text x={axisX + 4} y={pad.t - 10} className={AXIS_TEXT}>
              y (m)
            </text>
            {xT.values.map((v) => (
              <g key={`x${v}`}>
                <line x1={f.X(v)} x2={f.X(v)} y1={f.Y(0)} y2={f.Y(0) + 4} className="stroke-muted" />
                <text x={f.X(v)} y={f.Y(0) + 17} textAnchor="middle" className={AXIS_TEXT}>
                  {tickLabel(v, xT.step)}
                </text>
              </g>
            ))}
            <text x={W - pad.r} y={H - 2} textAnchor="end" className={AXIS_TEXT}>
              x (m)
            </text>
            {/* trajectory */}
            {T > 0 && <polyline points={pathPts(T)} fill="none" className="stroke-muted/50" strokeWidth={1.5} strokeDasharray="4 4" />}
            {t > 0 && <polyline points={pathPts(t)} fill="none" className="stroke-accent" strokeWidth={2} />}
            {strobes}
            {sim.tApex > 0 && sim.tApex < T && (
              <circle cx={f.X(sim.at(sim.tApex)[0].p)} cy={f.Y(sim.maxHeight)} r={4} fill="none" className="stroke-muted" strokeWidth={1.25} />
            )}
            {/* components, then full vectors */}
            <Arrow x={bx} y={by} dx={kx.v * sv} dy={0} tone="velocity" faint />
            <Arrow x={bx} y={by} dx={0} dy={-ky.v * sv} tone="velocity" faint />
            <Arrow x={bx} y={by} dx={kx.v * sv} dy={-ky.v * sv} tone="velocity" label="v" />
            <Arrow x={bx} y={by} dx={0} dy={G * sa} tone="accel" label="a" />
            <circle cx={bx} cy={by} r={7} className="fill-accent stroke-surface" strokeWidth={2} />
          </>
        )
      }}
    </SceneFrame>
  )
}

// ---------------------------------------------------------------- free fall

export function FreeFallScene({ sim, t, label }: { sim: FreeFallSim; t: number; label: string }) {
  return (
    <SceneFrame label={label} height={(w) => clamp(w * 0.7, 280, 420)}>
      {(W, H) => {
        const pad = { l: 56, r: 24, t: 26, b: 22 }
        const top = Math.max(sim.maxHeight, 1)
        const f = fitWorld({ x0: -1e-3, x1: 1e-3, y0: 0, y1: top }, W, H, pad, 'center')
        const cxBall = clamp(f.X(0), pad.l + 60, W - 80)
        const [k] = sim.at(t)
        const by = f.Y(k.p)
        const { sv, sa } = arrowScales(sim, clamp(H * 0.22, 50, 95))
        const yT = ticks(0, f.invY(pad.t), 5)
        const axisX = pad.l - 12
        const strobeDt = niceStep(Math.max(sim.duration, 1e-3), 10)
        const strobes: ReactNode[] = []
        for (let s = strobeDt; s < t - 1e-9; s += strobeDt) {
          strobes.push(<circle key={s} cx={cxBall} cy={f.Y(sim.at(s)[0].p)} r={4} className="fill-muted/35" />)
        }
        const ledgeTop = f.Y(sim.params.height)
        return (
          <>
            <rect x={pad.l} y={ledgeTop} width={Math.max(0, cxBall - 14 - pad.l)} height={f.Y(0) - ledgeTop} className="fill-surface2 stroke-border" />
            <Ground x0={0} x1={W} y={f.Y(0)} />
            <line x1={axisX} x2={axisX} y1={f.Y(0)} y2={pad.t - 6} className="stroke-muted" />
            {yT.values.map((v) => (
              <g key={v}>
                <line x1={axisX - 4} x2={axisX} y1={f.Y(v)} y2={f.Y(v)} className="stroke-muted" />
                <text x={axisX - 6} y={f.Y(v)} textAnchor="end" dominantBaseline="middle" className={AXIS_TEXT}>
                  {tickLabel(v, yT.step)}
                </text>
              </g>
            ))}
            <text x={axisX + 4} y={pad.t - 10} className={AXIS_TEXT}>
              y (m)
            </text>
            {strobes}
            <Arrow x={cxBall + 18} y={by} dx={0} dy={-k.v * sv} tone="velocity" label="v" />
            <Arrow x={cxBall + 40} y={by} dx={0} dy={G * sa} tone="accel" label="a" />
            <circle cx={cxBall} cy={by} r={8} className="fill-accent stroke-surface" strokeWidth={2} />
          </>
        )
      }}
    </SceneFrame>
  )
}

// ---------------------------------------------------------------- incline

const BLOCK_W = 38
const BLOCK_H = 24

export function InclineScene({ sim, t, label }: { sim: InclineSim; t: number; label: string }) {
  return (
    <SceneFrame label={label} height={(w) => clamp(w * 0.55, 230, 380)}>
      {(W, H) => {
        const { angleDeg, length: L } = sim.params
        const th = (angleDeg * Math.PI) / 180
        const c = Math.cos(th)
        const s = Math.sin(th)
        const pad = { l: 24, r: 24, t: 64, b: 30 }
        // Extend the drawn ramp by half a block at each end so the block never overhangs it.
        const k1 = fitWorld({ x0: 0, x1: L * c, y0: 0, y1: L * s }, W, H, pad, 'center').k
        const d = (BLOCK_W / 2 + 4) / k1
        const f = fitWorld({ x0: -d * c, x1: (L + d) * c, y0: -d * s, y1: (L + d) * s }, W, H, pad, 'center')
        const P = (sAlong: number) => ({ x: f.X(sAlong * c), y: f.Y(sAlong * s) })
        const bot = P(-d)
        const topV = P(L + d)
        const [k] = sim.at(t)
        const b = P(k.p)
        const ux = c // unit vector up the slope, screen coordinates
        const uy = -s
        const nx = -s // unit normal pointing away from the ramp
        const ny = -c
        const { sv, sa } = arrowScales(sim, clamp(Math.min(W, H) * 0.24, 50, 90))
        const vBase = { x: b.x + nx * (BLOCK_H + 14), y: b.y + ny * (BLOCK_H + 14) }
        const aBase = { x: b.x + nx * (BLOCK_H + 34), y: b.y + ny * (BLOCK_H + 34) }
        const sT = ticks(0, L, W < 420 ? 4 : 6)
        const r = 30
        return (
          <>
            <Ground x0={0} x1={W} y={bot.y} />
            <polygon points={`${bot.x},${bot.y} ${topV.x},${topV.y} ${topV.x},${bot.y}`} className="fill-surface2 stroke-border" strokeWidth={1.5} />
            <path d={`M${bot.x + r},${bot.y} A${r},${r} 0 0 0 ${bot.x + r * Math.cos(th)},${bot.y - r * Math.sin(th)}`} fill="none" className="stroke-muted" />
            <text x={bot.x + (r + 12) * Math.cos(th / 2)} y={bot.y - (r + 12) * Math.sin(th / 2)} dominantBaseline="middle" className="fill-muted font-mono text-[11px] italic">
              θ
            </text>
            {sT.values.map((v) => {
              const p = P(v)
              return (
                <g key={v}>
                  <line x1={p.x} y1={p.y} x2={p.x - nx * 5} y2={p.y - ny * 5} className="stroke-muted" />
                  <text x={p.x - nx * 15} y={p.y - ny * 15} textAnchor="middle" dominantBaseline="middle" className={AXIS_TEXT}>
                    {tickLabel(v, sT.step)}
                  </text>
                </g>
              )
            })}
            <text x={W - pad.r} y={H - 4} textAnchor="end" className={AXIS_TEXT}>
              s along ramp (m)
            </text>
            <g transform={`translate(${b.x} ${b.y}) rotate(${-angleDeg})`}>
              <rect x={-BLOCK_W / 2} y={-BLOCK_H} width={BLOCK_W} height={BLOCK_H} rx={3} className="fill-accent/25 stroke-accent" strokeWidth={1.75} />
            </g>
            <Arrow x={vBase.x} y={vBase.y} dx={ux * k.v * sv} dy={uy * k.v * sv} tone="velocity" label="v" />
            <Arrow x={aBase.x} y={aBase.y} dx={ux * k.a * sa} dy={uy * k.a * sa} tone="accel" label="a" />
          </>
        )
      }}
    </SceneFrame>
  )
}

// ---------------------------------------------------------------- Atwood machine

const PULLEY_R = 0.55
const PULLEY_Y = 5.9
const CEILING_Y = 6.6
const atwoodSize = (m: number) => 0.3 + 0.35 * Math.cbrt(m / 10)

export function AtwoodScene({ sim, t, label }: { sim: AtwoodSim; t: number; label: string }) {
  return (
    <SceneFrame label={label} height={(w) => clamp(w * 0.7, 300, 420)}>
      {(W, H) => {
        const pad = { l: 16, r: 16, t: 10, b: 14 }
        const f = fitWorld({ x0: -2.6, x1: 2.6, y0: 0, y1: CEILING_Y + 0.15 }, W, H, pad, 'center')
        const [k1, k2] = sim.at(t)
        const { sv, sa } = arrowScales(sim, clamp(H * 0.16, 40, 70))
        const masses = [
          { side: -1, m: sim.params.m1, kin: k1, name: 'm₁' },
          { side: 1, m: sim.params.m2, kin: k2, name: 'm₂' },
        ]
        const pr = PULLEY_R * f.k
        const pcx = f.X(0)
        const pcy = f.Y(PULLEY_Y)
        const ceil = f.Y(CEILING_Y)
        const hatches: ReactNode[] = []
        for (let x = pcx - 60; x < pcx + 60; x += 10) {
          hatches.push(<line key={x} x1={x} y1={ceil} x2={x + 7} y2={ceil - 7} className="stroke-border" />)
        }
        return (
          <>
            <Ground x0={0} x1={W} y={f.Y(0)} />
            {hatches}
            <line x1={pcx - 64} x2={pcx + 64} y1={ceil} y2={ceil} className="stroke-muted" strokeWidth={1.5} />
            <line x1={pcx} x2={pcx} y1={ceil} y2={pcy} className="stroke-muted" strokeWidth={2} />
            <line x1={f.X(-2.4)} x2={f.X(2.4)} y1={f.Y(ATWOOD_START_HEIGHT)} y2={f.Y(ATWOOD_START_HEIGHT)} className="stroke-border" strokeDasharray="4 4" />
            <text x={f.X(2.4)} y={f.Y(ATWOOD_START_HEIGHT) - 4} textAnchor="end" className={AXIS_TEXT}>
              start
            </text>
            {masses.map(({ side, m, kin, name }) => {
              const size = atwoodSize(m) * f.k
              const bottom = f.Y(ATWOOD_START_HEIGHT + kin.p)
              const cx = f.X(side * PULLEY_R)
              const outer = cx + side * (size / 2 + 14)
              const mid = bottom - size / 2
              return (
                <g key={name}>
                  <line x1={cx} x2={cx} y1={pcy} y2={bottom - size} className="stroke-text" strokeWidth={1.5} />
                  <rect x={cx - size / 2} y={bottom - size} width={size} height={size} rx={3} className="fill-accent/25 stroke-accent" strokeWidth={1.75} />
                  <Arrow x={outer} y={mid} dx={0} dy={-kin.v * sv} tone="velocity" label="v" />
                  <Arrow x={outer + side * 22} y={mid} dx={0} dy={-kin.a * sa} tone="accel" label="a" />
                  <text
                    x={outer + side * 36}
                    y={mid}
                    textAnchor={side < 0 ? 'end' : 'start'}
                    dominantBaseline="middle"
                    className="fill-text font-mono text-[11px]"
                  >
                    {name} {fmtFixed(m, 1)} kg
                  </text>
                </g>
              )
            })}
            <circle cx={pcx} cy={pcy} r={pr} className="fill-surface2 stroke-text" strokeWidth={1.5} />
            <circle cx={pcx} cy={pcy} r={3} className="fill-text" />
            <text x={f.X(-2.4)} y={f.Y(0) - 6} className={AXIS_TEXT}>
              floor ({ATWOOD_TRAVEL} m below start)
            </text>
          </>
        )
      }}
    </SceneFrame>
  )
}

// ---------------------------------------------------------------- spring

const SPRING_BLOCK_W = 48
const SPRING_BLOCK_H = 38

export function SpringScene({ sim, t, label }: { sim: SpringSim; t: number; label: string }) {
  return (
    <SceneFrame label={label} height={(w) => clamp(w * 0.36, 210, 260)}>
      {(W, H) => {
        const A = sim.params.amplitude
        const L0 = 1.6 * A // natural length; the spring is never fully compressed
        const pad = { l: 26, r: SPRING_BLOCK_W + 26 }
        const k = (W - pad.l - pad.r) / (L0 + A)
        const X = (x: number) => pad.l + (x + L0) * k
        const floorY = H - 40
        const [kin] = sim.at(t)
        const bx = X(kin.p)
        const wallX = X(-L0)
        const springY = floorY - SPRING_BLOCK_H / 2

        // zigzag spring from the wall to the block's left face
        const coils = 14
        const lead = 8
        const len = bx - wallX
        const amp = 8
        const pts: string[] = [`${wallX},${springY}`, `${wallX + lead},${springY}`]
        for (let i = 0; i < coils; i++) {
          const x = wallX + lead + ((i + 0.5) / coils) * (len - 2 * lead)
          pts.push(`${x.toFixed(1)},${springY + (i % 2 === 0 ? -amp : amp)}`)
        }
        pts.push(`${bx - lead},${springY}`, `${bx},${springY}`)

        const wallHatch: ReactNode[] = []
        for (let y = floorY - 80; y < floorY; y += 10) {
          wallHatch.push(<line key={y} x1={wallX} y1={y + 8} x2={wallX - 8} y2={y} className="stroke-border" />)
        }
        const xT = ticks(-A, A, W < 420 ? 4 : 6)
        const { sv, sa } = arrowScales(sim, clamp(W * 0.18, 45, 90))
        const cxBlock = bx + SPRING_BLOCK_W / 2
        return (
          <>
            {wallHatch}
            <line x1={wallX} x2={wallX} y1={floorY - 84} y2={floorY} className="stroke-muted" strokeWidth={2} />
            <Ground x0={wallX} x1={W} y={floorY} />
            <line x1={X(0)} x2={X(0)} y1={floorY - SPRING_BLOCK_H - 46} y2={floorY + 4} className="stroke-muted/60" strokeDasharray="4 4" />
            <text x={X(0) + 4} y={floorY - SPRING_BLOCK_H - 40} className={AXIS_TEXT}>
              equilibrium
            </text>
            {xT.values.map((v) => (
              <g key={v}>
                <line x1={X(v)} x2={X(v)} y1={floorY + 8} y2={floorY + 12} className="stroke-muted" />
                <text x={X(v)} y={floorY + 24} textAnchor="middle" className={AXIS_TEXT}>
                  {tickLabel(v, xT.step)}
                </text>
              </g>
            ))}
            <text x={W - 4} y={H - 2} textAnchor="end" className={AXIS_TEXT}>
              x (m)
            </text>
            <polyline points={pts.join(' ')} fill="none" className="stroke-text" strokeWidth={1.75} strokeLinejoin="round" />
            <rect x={bx} y={floorY - SPRING_BLOCK_H} width={SPRING_BLOCK_W} height={SPRING_BLOCK_H} rx={3} className="fill-accent/25 stroke-accent" strokeWidth={1.75} />
            <text x={cxBlock} y={floorY - SPRING_BLOCK_H / 2} textAnchor="middle" dominantBaseline="middle" className="fill-text font-mono text-[12px] italic">
              m
            </text>
            <Arrow x={cxBlock} y={floorY - SPRING_BLOCK_H - 14} dx={kin.v * sv} dy={0} tone="velocity" label="v" />
            <Arrow x={cxBlock} y={floorY - SPRING_BLOCK_H - 32} dx={kin.a * sa} dy={0} tone="accel" label="a" />
          </>
        )
      }}
    </SceneFrame>
  )
}

export function Scene({ sim, t, label }: { sim: Simulation; t: number; label: string }) {
  switch (sim.kind) {
    case 'projectile':
      return <ProjectileScene sim={sim} t={t} label={label} />
    case 'free-fall':
      return <FreeFallScene sim={sim} t={t} label={label} />
    case 'incline':
      return <InclineScene sim={sim} t={t} label={label} />
    case 'atwood':
      return <AtwoodScene sim={sim} t={t} label={label} />
    case 'spring':
      return <SpringScene sim={sim} t={t} label={label} />
  }
}
