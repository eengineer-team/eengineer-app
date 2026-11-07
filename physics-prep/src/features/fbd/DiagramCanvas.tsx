import { useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { cx } from '@/components/ui'
import {
  ANGLE_STEP,
  FORCE_INFO,
  clampLength,
  directionWord,
  lengthWord,
  normalizeAngle,
  snapAngle,
  type PlacedForce,
} from './forces'
import type { Scenario } from './scenarios'
import { SvgArrow, SvgLabel } from './svg'

// Interactive SVG canvas. All arrows start at the object's center; the tip sets direction and length.

const SIZE = 400
const C = SIZE / 2
const RAD = Math.PI / 180
/** Pointer travel (px in diagram units) before grabbing a shaft turns into a drag. */
const DRAG_SLOP = 6

function tipOf(f: Pick<PlacedForce, 'angle' | 'length'>) {
  return { x: C + f.length * Math.cos(f.angle * RAD), y: C - f.length * Math.sin(f.angle * RAD) }
}

interface Props {
  scenario: Scenario
  forces: PlacedForce[]
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  onUpdate?: (id: string, patch: Partial<PlacedForce>) => void
  onRemove?: (id: string) => void
  readOnly?: boolean
  label: string
}

export function DiagramCanvas({ scenario, forces, selectedId, onSelect, onUpdate, onRemove, readOnly, label }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const drag = useRef<{ id: string; pointerId: number; x: number; y: number; active: boolean } | null>(null)

  function toSvg(e: PointerEvent) {
    const svg = svgRef.current
    const ctm = svg?.getScreenCTM()
    if (!svg || !ctm) return null
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse())
    return { x: p.x, y: p.y }
  }

  function aimAt(id: string, x: number, y: number) {
    const dx = x - C
    const dy = C - y
    if (Math.hypot(dx, dy) < 14) return // too close to the center to read a direction
    onUpdate?.(id, { angle: snapAngle(Math.atan2(dy, dx) / RAD), length: clampLength(Math.round(Math.hypot(dx, dy))) })
  }

  function startDrag(e: PointerEvent, id: string, immediate: boolean) {
    if (readOnly) return
    e.stopPropagation()
    e.preventDefault()
    onSelect?.(id)
    const p = toSvg(e)
    if (!p) return
    drag.current = { id, pointerId: e.pointerId, x: p.x, y: p.y, active: immediate }
    svgRef.current?.setPointerCapture(e.pointerId)
  }

  function onMove(e: PointerEvent) {
    const d = drag.current
    if (!d || d.pointerId !== e.pointerId) return
    const p = toSvg(e)
    if (!p) return
    if (!d.active && Math.hypot(p.x - d.x, p.y - d.y) < DRAG_SLOP) return
    d.active = true
    aimAt(d.id, p.x, p.y)
  }

  function endDrag(e: PointerEvent) {
    if (drag.current?.pointerId !== e.pointerId) return
    drag.current = null
    if (svgRef.current?.hasPointerCapture(e.pointerId)) svgRef.current.releasePointerCapture(e.pointerId)
  }

  function onArrowKey(e: KeyboardEvent, f: PlacedForce) {
    if (readOnly) return
    const step = e.shiftKey ? ANGLE_STEP * 2 : ANGLE_STEP
    let patch: Partial<PlacedForce> | null = null
    switch (e.key) {
      case 'ArrowLeft':
        patch = { angle: normalizeAngle(f.angle + step) }
        break
      case 'ArrowRight':
        patch = { angle: normalizeAngle(f.angle - step) }
        break
      case 'ArrowUp':
        patch = { length: clampLength(f.length + 10) }
        break
      case 'ArrowDown':
        patch = { length: clampLength(f.length - 10) }
        break
      case 'Delete':
      case 'Backspace':
        e.preventDefault()
        onRemove?.(f.id)
        return
      case 'Escape':
        onSelect?.(null)
        ;(e.currentTarget as SVGGElement).blur()
        return
      default:
        return
    }
    e.preventDefault()
    onUpdate?.(f.id, patch)
  }

  const tiltRad = scenario.axesTilt * RAD
  const ax = { x: Math.cos(tiltRad), y: -Math.sin(tiltRad) } // +x axis direction (svg coords)
  const ay = { x: -Math.sin(tiltRad), y: -Math.cos(tiltRad) } // +y axis direction (svg coords)
  const axisLen = 185
  const tilted = scenario.axesTilt !== 0

  // DOM order stays stable (reordering would steal keyboard focus); the selected handle is redrawn on top instead.
  const selectedForce = readOnly ? undefined : forces.find((f) => f.id === selectedId)
  const selectedTip = selectedForce ? tipOf(selectedForce) : null

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={cx('block h-auto w-full select-none', !readOnly && 'touch-none')}
      role="group"
      aria-label={label}
      onPointerDown={readOnly ? undefined : () => onSelect?.(null)}
      onPointerMove={readOnly ? undefined : onMove}
      onPointerUp={readOnly ? undefined : endDrag}
      onPointerCancel={readOnly ? undefined : endDrag}
    >
      <rect width={SIZE} height={SIZE} className="fill-surface" />

      {/* 15° tick ring helps judge direction */}
      <g className="stroke-border" strokeWidth={1.5}>
        {Array.from({ length: 24 }, (_, i) => {
          const a = i * ANGLE_STEP * RAD
          const major = i % 6 === 0
          const r1 = major ? 170 : 178
          return (
            <line
              key={i}
              x1={C + r1 * Math.cos(a)}
              y1={C - r1 * Math.sin(a)}
              x2={C + 188 * Math.cos(a)}
              y2={C - 188 * Math.sin(a)}
              strokeWidth={major ? 2 : 1}
            />
          )
        })}
      </g>

      {/* reference axes (tilted for the incline) */}
      <g className="stroke-muted/50" strokeDasharray="5 5" strokeWidth={1}>
        <line x1={C - axisLen * ax.x} y1={C - axisLen * ax.y} x2={C + axisLen * ax.x} y2={C + axisLen * ax.y} />
        <line x1={C - axisLen * ay.x} y1={C - axisLen * ay.y} x2={C + axisLen * ay.x} y2={C + axisLen * ay.y} />
      </g>
      <g className="fill-muted font-mono" fontSize={12}>
        <text x={C + 160 * ax.x + 6 * ay.x} y={C + 160 * ax.y + 6 * ay.y - 4} textAnchor="middle">
          {tilted ? '+∥' : '+x'}
        </text>
        <text x={C + 160 * ay.x + 14 * ax.x} y={C + 160 * ay.y + 14 * ax.y} textAnchor="middle">
          {tilted ? '+⊥' : '+y'}
        </text>
      </g>

      <ObjectShape scenario={scenario} />
      <MotionCueMark scenario={scenario} />

      {forces.map((f) => {
        const tip = tipOf(f)
        const selected = f.id === selectedId
        const info = FORCE_INFO[f.type]
        const lx = tip.x + 20 * Math.cos(f.angle * RAD)
        const ly = tip.y - 20 * Math.sin(f.angle * RAD)
        const cos = Math.cos(f.angle * RAD)
        const anchor = cos > 0.35 ? 'start' : cos < -0.35 ? 'end' : 'middle'
        // Keep the label inside the canvas using a rough monospace width estimate.
        const w = Math.max(1, (f.label || '?').replace('_', '').length) * 9.5
        const minX = anchor === 'start' ? 6 : anchor === 'end' ? 6 + w : 6 + w / 2
        const maxX = anchor === 'start' ? SIZE - 6 - w : anchor === 'end' ? SIZE - 6 : SIZE - 6 - w / 2
        return (
          <g
            key={f.id}
            tabIndex={readOnly ? undefined : 0}
            role={readOnly ? undefined : 'button'}
            aria-pressed={readOnly ? undefined : selected}
            aria-label={`${f.label || info.name} (${info.name}), pointing ${directionWord(f.angle)} at ${f.angle} degrees, ${lengthWord(f.length)} arrow`}
            className="cursor-pointer outline-none"
            onFocus={readOnly ? undefined : () => onSelect?.(f.id)}
            onKeyDown={(e) => onArrowKey(e, f)}
            onPointerDown={readOnly ? undefined : (e) => startDrag(e, f.id, false)}
          >
            {selected && (
              <line
                x1={C}
                y1={C}
                x2={tip.x}
                y2={tip.y}
                className="stroke-accent/35"
                strokeWidth={14}
                strokeLinecap="round"
              />
            )}
            {/* wide invisible hit area so thin arrows are easy to grab */}
            <line x1={C} y1={C} x2={tip.x} y2={tip.y} stroke="transparent" strokeWidth={22} />
            <SvgArrow
              x1={C}
              y1={C}
              x2={tip.x}
              y2={tip.y}
              head={selected ? 15 : 13}
              width={selected ? 4 : 3}
              className="fill-force stroke-force"
            />
            <text
              x={Math.min(maxX, Math.max(minX, lx))}
              y={Math.min(SIZE - 8, Math.max(16, ly + 5))}
              textAnchor={anchor}
              fontSize={16}
              className={cx('font-mono font-semibold', selected ? 'fill-accent' : 'fill-force')}
              style={{ paintOrder: 'stroke', stroke: 'rgb(var(--surface))', strokeWidth: 4 }}
            >
              <SvgLabel label={f.label || '?'} subSize={11} />
            </text>
            {!readOnly && (
              <g onPointerDown={(e) => startDrag(e, f.id, true)}>
                <circle cx={tip.x} cy={tip.y} r={22} fill="transparent" />
              </g>
            )}
          </g>
        )
      })}
      <circle cx={C} cy={C} r={4} className="fill-text" />
      {selectedTip && (
        <circle
          cx={selectedTip.x}
          cy={selectedTip.y}
          r={9}
          className="pointer-events-none fill-surface stroke-accent"
          strokeWidth={3}
        />
      )}
    </svg>
  )
}

function ObjectShape({ scenario }: { scenario: Scenario }) {
  const obj = 'fill-accent/10 stroke-accent/60'
  if (scenario.shape === 'person') {
    return (
      <g className="stroke-accent/50" strokeWidth={4} strokeLinecap="round" fill="none">
        <line x1={C - 70} y1={C + 92} x2={C + 70} y2={C + 92} className="stroke-muted/60" strokeWidth={3} />
        <circle cx={C} cy={C - 62} r={18} className="fill-accent/10" />
        <line x1={C} y1={C - 44} x2={C} y2={C + 30} />
        <line x1={C - 30} y1={C} x2={C} y2={C - 22} />
        <line x1={C + 30} y1={C} x2={C} y2={C - 22} />
        <line x1={C} y1={C + 30} x2={C - 20} y2={C + 90} />
        <line x1={C} y1={C + 30} x2={C + 20} y2={C + 90} />
      </g>
    )
  }
  if (scenario.shape === 'mass') {
    const big = scenario.id === 'atwood-machine'
    return (
      <g>
        <rect x={C - 36} y={C - 36} width={72} height={72} rx={8} className={obj} strokeWidth={2} />
        <text x={C + 24} y={C + 28} fontSize={14} textAnchor="middle" className="fill-muted font-mono">
          {big ? 'M' : 'm'}
        </text>
      </g>
    )
  }
  // Blocks sit on a surface; on the incline both rotate with the slope.
  return (
    <g transform={`rotate(${-scenario.axesTilt} ${C} ${C})`}>
      <line x1={C - 150} y1={C + 40} x2={C + 150} y2={C + 40} className="stroke-muted/60" strokeWidth={3} />
      <rect x={C - 40} y={C - 40} width={80} height={80} rx={4} className={obj} strokeWidth={2} />
    </g>
  )
}

function MotionCueMark({ scenario }: { scenario: Scenario }) {
  const m = scenario.motion
  const color = m.kind === 'velocity' ? 'fill-velocity stroke-velocity' : 'fill-accel stroke-accel'
  const text = m.kind === 'velocity' ? 'fill-velocity' : 'fill-accel'
  const ox = 44
  const oy = 44
  if (m.atRest) {
    return (
      <text x={16} y={30} fontSize={13} className={cx('font-mono', text)}>
        {m.label}
      </text>
    )
  }
  const len = 26
  const dx = len * Math.cos(m.angle * RAD)
  const dy = -len * Math.sin(m.angle * RAD)
  return (
    <g aria-hidden="true">
      <SvgArrow x1={ox - dx} y1={oy - dy} x2={ox + dx} y2={oy + dy} head={9} width={2.5} className={color} />
      <text x={ox + 34} y={oy + 5} fontSize={14} className={cx('font-mono', text)}>
        {m.label}
      </text>
    </g>
  )
}
