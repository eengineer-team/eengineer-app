import { useMemo, type ReactNode } from 'react'
import { fmtFixed, niceRange, tickLabel, ticks } from './format'
import { useElementWidth } from './hooks'

export type ChartTone = 'accent' | 'velocity' | 'accel'

const TONES: Record<ChartTone, { stroke: string; fill: string }> = {
  accent: { stroke: 'stroke-accent', fill: 'fill-accent' },
  velocity: { stroke: 'stroke-velocity', fill: 'fill-velocity' },
  accel: { stroke: 'stroke-accel', fill: 'fill-accel' },
}

interface ChartProps {
  title: ReactNode
  /** Plain-text name for screen readers, e.g. "Velocity vₓ". */
  name: string
  unit: string
  times: number[]
  values: number[]
  tMax: number
  t: number
  value: number
  tone: ChartTone
  height?: number
}

const PAD = { l: 48, r: 14, t: 10, b: 28 }

/** Quantity-vs-time line graph with axes, ticks and a cursor at the current time. */
export function Chart({ title, name, unit, times, values, tMax, t, value, tone, height = 150 }: ChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const span = tMax > 1e-6 ? tMax : 1
  const [yMin, yMax] = useMemo(() => niceRange(values), [values])
  const plotW = Math.max(10, width - PAD.l - PAD.r)
  const plotH = height - PAD.t - PAD.b
  const X = (tt: number) => PAD.l + (tt / span) * plotW
  const Y = (v: number) => PAD.t + ((yMax - v) / (yMax - yMin)) * plotH

  const path = useMemo(() => {
    if (width === 0 || times.length === 0) return ''
    const pts: string[] = []
    for (let i = 0; i < times.length; i++) {
      pts.push(`${i === 0 ? 'M' : 'L'}${(PAD.l + (times[i] / span) * plotW).toFixed(1)},${(PAD.t + ((yMax - values[i]) / (yMax - yMin)) * plotH).toFixed(1)}`)
    }
    return pts.join('')
  }, [times, values, width, span, plotW, plotH, yMin, yMax])

  const yT = ticks(yMin, yMax, 4)
  const tT = ticks(0, span, width < 420 ? 4 : 8)
  const tone_ = TONES[tone]
  const cx = X(Math.min(t, span))
  const cy = Y(value)

  return (
    <figure className="min-w-0 rounded-lg border border-border bg-surface p-3">
      <figcaption className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-semibold">{title}</span>
        <span className="font-mono text-xs text-muted">
          {fmtFixed(value)} {unit}
        </span>
      </figcaption>
      <div ref={ref} className="mt-1 w-full">
        {width > 0 && (
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={`${name} in ${unit} versus time over ${fmtFixed(tMax)} seconds. Now ${fmtFixed(value)} ${unit} at t = ${fmtFixed(t)} s.`}
            className="block overflow-visible"
          >
            {yT.values.map((v) => (
              <g key={`y${v}`}>
                <line x1={PAD.l} x2={PAD.l + plotW} y1={Y(v)} y2={Y(v)} className={v === 0 ? 'stroke-muted/60' : 'stroke-border'} strokeWidth={1} />
                <text x={PAD.l - 6} y={Y(v)} textAnchor="end" dominantBaseline="middle" className="fill-muted font-mono text-[10px]">
                  {tickLabel(v, yT.step)}
                </text>
              </g>
            ))}
            {tT.values.map((v) => (
              <g key={`t${v}`}>
                <line x1={X(v)} x2={X(v)} y1={PAD.t + plotH} y2={PAD.t + plotH + 4} className="stroke-muted" strokeWidth={1} />
                <text x={X(v)} y={PAD.t + plotH + 15} textAnchor="middle" className="fill-muted font-mono text-[10px]">
                  {tickLabel(v, tT.step)}
                </text>
              </g>
            ))}
            <line x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={PAD.t + plotH} className="stroke-muted" strokeWidth={1} />
            <text x={PAD.l + plotW} y={height - 1} textAnchor="end" className="fill-muted font-mono text-[10px]">
              t (s)
            </text>
            <path d={path} fill="none" className={tone_.stroke} strokeWidth={2} strokeLinejoin="round" />
            <line x1={cx} x2={cx} y1={PAD.t} y2={PAD.t + plotH} className="stroke-text/50" strokeWidth={1} strokeDasharray="3 3" />
            <circle cx={cx} cy={cy} r={4.5} className={`${tone_.fill} stroke-surface`} strokeWidth={2} />
          </svg>
        )}
      </div>
    </figure>
  )
}
