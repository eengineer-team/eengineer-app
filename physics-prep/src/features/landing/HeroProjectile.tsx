import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'

// A self-contained projectile demo for the hero. Real kinematics (v₀ = 20 m/s, θ = 55°, g = 9.8 m/s²),
// drawn in SVG with colors from the semantic physics tokens.

const V0 = 20
const THETA = (55 * Math.PI) / 180
const G = 9.8
const VX = V0 * Math.cos(THETA)
const VY0 = V0 * Math.sin(THETA)
const T_FLIGHT = (2 * VY0) / G
const RANGE = VX * T_FLIGHT
const H_MAX = (VY0 * VY0) / (2 * G)

const W = 400
const H = 250
const OX = 36 // launch point in SVG px
const OY = 214
const PX_PER_M = 8.4
const PX_PER_MPS = 2.2 // velocity arrow scale
const G_ARROW = 26

const HOLD = 1.4 // seconds the landed frame stays up before relaunch
const SPEED = 0.8 // playback rate, slightly slower than real time for readability
const CYCLE = T_FLIGHT + HOLD
const STROBE_DT = 0.25
const REST_T = T_FLIGHT * 0.28 // static frame for reduced motion: rising, both components visible

const sx = (x: number) => OX + x * PX_PER_M
const sy = (y: number) => OY - y * PX_PER_M

const PATH = Array.from({ length: 49 }, (_, i) => {
  const t = (T_FLIGHT * i) / 48
  return `${sx(VX * t).toFixed(1)},${sy(VY0 * t - 0.5 * G * t * t).toFixed(1)}`
}).join(' ')

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

function Arrow({ x1, y1, x2, y2, className, width = 2.5 }: { x1: number; y1: number; x2: number; y2: number; className: string; width?: number }) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy)
  if (len < 3) return null
  const ux = dx / len
  const uy = dy / len
  const head = 7
  // Stop the shaft at the base of the head so the line cap does not poke through the tip.
  const bx = x2 - ux * head
  const by = y2 - uy * head
  const px = -uy * head * 0.55
  const py = ux * head * 0.55
  return (
    <g className={className}>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke="currentColor" strokeWidth={width} strokeLinecap="round" />
      <polygon points={`${x2},${y2} ${bx + px},${by + py} ${bx - px},${by - py}`} fill="currentColor" />
    </g>
  )
}

function Sub({ base, sub }: { base: string; sub: string }) {
  return (
    <>
      {base}
      <tspan dy="3" fontSize="8">
        {sub}
      </tspan>
    </>
  )
}

export function HeroProjectile() {
  const [playing, setPlaying] = useState(() => !prefersReducedMotion())
  const [visible, setVisible] = useState(true)
  // Animated: start at launch. Reduced motion: start on the informative static frame.
  const [clock, setClock] = useState(() => (prefersReducedMotion() ? REST_T : 0))
  const clockRef = useRef(clock)
  const wrapRef = useRef<HTMLDivElement>(null)

  // If the user switches reduced motion on mid-session, stop.
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    const onChange = () => mq.matches && setPlaying(false)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Don't burn frames while scrolled out of view.
  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!playing || !visible) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000) // clamp so a stalled tab doesn't skip a whole flight
      last = now
      clockRef.current = (clockRef.current + dt * SPEED) % CYCLE
      setClock(clockRef.current)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, visible])

  const landed = clock >= T_FLIGHT
  const t = Math.min(clock, T_FLIGHT)
  const x = VX * t
  const y = Math.max(0, VY0 * t - 0.5 * G * t * t)
  const vy = VY0 - G * t
  const speed = Math.hypot(VX, vy)
  const bx = sx(x)
  const by = sy(y)

  const strobe: Array<[number, number]> = []
  for (let s = 0; s < t; s += STROBE_DT) strobe.push([sx(VX * s), sy(VY0 * s - 0.5 * G * s * s)])

  const arcR = 24

  return (
    <div ref={wrapRef} className="relative overflow-hidden rounded-lg border border-border bg-surface shadow-[0_1px_0_rgb(var(--border)/0.6),0_24px_48px_-24px_rgb(var(--accent)/0.35)]">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <p className="min-w-0 font-mono text-[11px] tracking-wide text-muted">projectile · v₀ = 20 m/s · θ = 55°</p>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? 'Pause animation' : 'Play animation'}
          aria-pressed={!playing}
          className="rounded-md p-1.5 text-muted hover:bg-surface2 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full"
        role="img"
        aria-label="A ball launched at 20 metres per second, 55 degrees above horizontal, follows a parabola. Its horizontal velocity stays constant while its vertical velocity shrinks, flips and grows under gravity."
      >
        {/* Background grid, one line per 5 m */}
        <g className="text-border" stroke="currentColor" strokeWidth={0.6} opacity={0.45}>
          {Array.from({ length: 9 }, (_, i) => (
            <line key={`v${i}`} x1={sx(i * 5)} y1={14} x2={sx(i * 5)} y2={OY} />
          ))}
          {Array.from({ length: 5 }, (_, i) => (
            <line key={`h${i}`} x1={OX} y1={sy(i * 5)} x2={W - 12} y2={sy(i * 5)} />
          ))}
        </g>

        {/* Ground */}
        <line x1={12} y1={OY} x2={W - 12} y2={OY} className="text-muted" stroke="currentColor" strokeWidth={1.5} />

        {/* Predicted path */}
        <polyline points={PATH} fill="none" className="text-accent" stroke="currentColor" strokeWidth={1.5} strokeDasharray="4 5" opacity={0.7} />

        {/* Max height marker */}
        <g className="fill-muted font-mono" fontSize={10}>
          <line x1={sx(RANGE / 2) - 26} y1={sy(H_MAX)} x2={sx(RANGE / 2) + 26} y2={sy(H_MAX)} className="text-muted" stroke="currentColor" strokeWidth={0.8} strokeDasharray="2 3" />
          <text x={sx(RANGE / 2) + 32} y={sy(H_MAX) + 3.5}>
            H = {H_MAX.toFixed(1)} m
          </text>
        </g>

        {/* Launch angle */}
        <path
          d={`M ${OX + arcR} ${OY} A ${arcR} ${arcR} 0 0 0 ${OX + arcR * Math.cos(THETA)} ${OY - arcR * Math.sin(THETA)}`}
          fill="none"
          className="text-muted"
          stroke="currentColor"
          strokeWidth={1}
        />
        <text x={OX + arcR + 5} y={OY - 7} fontSize={11} className="fill-muted font-mono">
          θ
        </text>

        {/* Strobe: equal time steps, so horizontal spacing is constant */}
        <g className="fill-accent">
          {strobe.map(([px, py], i) => (
            <circle key={i} cx={px} cy={py} r={3} opacity={0.35} />
          ))}
        </g>

        {landed ? (
          <g className="fill-muted font-mono" fontSize={10}>
            <line x1={OX} y1={OY + 14} x2={sx(RANGE)} y2={OY + 14} className="text-muted" stroke="currentColor" strokeWidth={1} />
            <line x1={OX} y1={OY + 9} x2={OX} y2={OY + 19} className="text-muted" stroke="currentColor" strokeWidth={1} />
            <line x1={sx(RANGE)} y1={OY + 9} x2={sx(RANGE)} y2={OY + 19} className="text-muted" stroke="currentColor" strokeWidth={1} />
            <text x={sx(RANGE / 2)} y={OY + 30} textAnchor="middle">
              R = {RANGE.toFixed(1)} m
            </text>
          </g>
        ) : (
          <g>
            {/* Components first so the resultant draws on top */}
            <g opacity={0.55}>
              <Arrow x1={bx} y1={by} x2={bx + VX * PX_PER_MPS} y2={by} className="text-velocity" width={1.8} />
              <Arrow x1={bx} y1={by} x2={bx} y2={by - vy * PX_PER_MPS} className="text-velocity" width={1.8} />
            </g>
            <Arrow x1={bx} y1={by} x2={bx + VX * PX_PER_MPS} y2={by - vy * PX_PER_MPS} className="text-velocity" />
            <Arrow x1={bx} y1={by} x2={bx} y2={by + G_ARROW} className="text-accel" width={2} />
            <g className="font-mono" fontSize={11}>
              <text x={bx + VX * PX_PER_MPS + 6} y={by - vy * PX_PER_MPS} className="fill-velocity">
                v
              </text>
              <text x={bx + VX * PX_PER_MPS + 4} y={by + 12} className="fill-velocity" opacity={0.75}>
                <Sub base="v" sub="x" />
              </text>
              {Math.abs(vy) * PX_PER_MPS > 10 && (
                <text x={bx - 16} y={by - (vy * PX_PER_MPS) / 2 + 4} className="fill-velocity" opacity={0.75}>
                  <Sub base="v" sub="y" />
                </text>
              )}
              <text x={bx + 5} y={by + G_ARROW + 2} className="fill-accel">
                g
              </text>
            </g>
          </g>
        )}

        {/* Ball */}
        <circle cx={bx} cy={by} r={6.5} className="fill-text" />
        <circle cx={bx - 2} cy={by - 2} r={2} className="fill-surface" opacity={0.6} />
      </svg>

      <dl className="grid grid-cols-4 gap-2 border-t border-border px-4 py-3 font-mono text-xs tabular-nums">
        {[
          ['t', `${t.toFixed(2)} s`],
          ['x', `${x.toFixed(1)} m`],
          ['y', `${y.toFixed(1)} m`],
          ['|v|', `${speed.toFixed(1)} m/s`],
        ].map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-muted">{k}</dt>
            <dd className="truncate text-text">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
