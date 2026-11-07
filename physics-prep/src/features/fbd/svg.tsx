import { Fragment, type ReactNode } from 'react'

// Small SVG/text helpers shared by the canvas, the answer view and the scenario thumbnails.

/** Points of an arrowhead whose tip sits at (x2, y2). */
export function arrowHeadPoints(x1: number, y1: number, x2: number, y2: number, size: number): string {
  const ang = Math.atan2(y2 - y1, x2 - x1)
  const spread = 0.45
  const p1 = [x2 - size * Math.cos(ang - spread), y2 - size * Math.sin(ang - spread)]
  const p2 = [x2 - size * Math.cos(ang + spread), y2 - size * Math.sin(ang + spread)]
  return `${x2},${y2} ${p1[0].toFixed(1)},${p1[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
}

/** Line plus filled head. Color comes from the className (stroke-* and fill-*). */
export function SvgArrow({
  x1,
  y1,
  x2,
  y2,
  head = 9,
  width = 2,
  className,
}: {
  x1: number
  y1: number
  x2: number
  y2: number
  head?: number
  width?: number
  className: string
}) {
  const len = Math.hypot(x2 - x1, y2 - y1) || 1
  // Stop the shaft inside the head so the line cap doesn't poke past the tip.
  const back = Math.min(head * 0.8, len)
  const sx = x2 - ((x2 - x1) / len) * back
  const sy = y2 - ((y2 - y1) / len) * back
  return (
    <g className={className}>
      <line x1={x1} y1={y1} x2={sx} y2={sy} strokeWidth={width} strokeLinecap="round" />
      <polygon points={arrowHeadPoints(x1, y1, x2, y2, head)} stroke="none" />
    </g>
  )
}

/** Renders "F_N" as F with a subscript N inside an SVG <text>. */
export function SvgLabel({ label, subSize }: { label: string; subSize: number }) {
  const i = label.indexOf('_')
  if (i <= 0 || i === label.length - 1) return <>{label}</>
  return (
    <>
      {label.slice(0, i)}
      <tspan dy={subSize * 0.35} fontSize={subSize}>
        {label.slice(i + 1)}
      </tspan>
    </>
  )
}

/** Renders symbols like F_N, μ_k or m₁ in prose, turning "X_y" into X with a subscript y. */
export function RichText({ text }: { text: string }) {
  const parts: ReactNode[] = []
  const re = /([A-Za-zμ])_([A-Za-z]+)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    parts.push(text.slice(last, m.index))
    parts.push(
      <Fragment key={m.index}>
        {m[1]}
        <sub>{m[2]}</sub>
      </Fragment>,
    )
    last = m.index + m[0].length
  }
  parts.push(text.slice(last))
  return <>{parts}</>
}
