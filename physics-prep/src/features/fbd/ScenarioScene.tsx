import type { ComponentType } from 'react'
import type { FreeBodyPreset } from '@/types/problem'
import { cx } from '@/components/ui'
import { SvgArrow } from './svg'

// Small pictures of each physical setup. The object of interest is drawn in the accent color.

const OBJ = 'fill-accent/20 stroke-accent'
const LINE = 'stroke-muted'
const TXT = 'fill-text font-mono'

function Hatch({ x1, x2, y, up = false }: { x1: number; x2: number; y: number; up?: boolean }) {
  const ticks = []
  for (let x = x1 + 4; x <= x2; x += 10) ticks.push(<line key={x} x1={x} y1={y} x2={x - 6} y2={up ? y - 6 : y + 6} />)
  return (
    <g className={LINE} strokeWidth={1.2}>
      <line x1={x1} y1={y} x2={x2} y2={y} strokeWidth={2} />
      {ticks}
    </g>
  )
}

function FloorPulled() {
  return (
    <>
      <Hatch x1={10} x2={190} y={96} />
      <rect x={58} y={64} width={42} height={32} rx={2} className={OBJ} strokeWidth={2} />
      <line x1={100} y1={72} x2={154} y2={41} className={LINE} strokeWidth={2} />
      <circle cx={156} cy={40} r={3} className="fill-muted" />
      <line x1={100} y1={72} x2={134} y2={72} className={LINE} strokeDasharray="3 3" />
      <path d="M120 72 A20 20 0 0 0 117.3 62" fill="none" className={LINE} />
      <text x={124} y={68} fontSize={9} className={TXT}>
        30°
      </text>
      <SvgArrow x1={60} y1={50} x2={96} y2={50} head={7} className="fill-velocity stroke-velocity" />
      <text x={74} y={44} fontSize={10} className="fill-velocity font-mono">
        v
      </text>
    </>
  )
}

function Incline() {
  return (
    <>
      <polygon points="20,100 180,100 20,7.6" className="fill-surface2 stroke-muted" strokeWidth={2} />
      <path d="M152 100 A28 28 0 0 1 155.75 86" fill="none" className={LINE} />
      <text x={132} y={96} fontSize={9} className={TXT}>
        30°
      </text>
      <g transform="translate(96 51.5) rotate(30)">
        <rect x={-16} y={-22} width={32} height={22} rx={2} className={OBJ} strokeWidth={2} />
        <SvgArrow x1={-14} y1={-32} x2={20} y2={-32} head={7} className="fill-velocity stroke-velocity" />
        <text x={-2} y={-38} fontSize={10} className="fill-velocity font-mono">
          v
        </text>
      </g>
    </>
  )
}

function Hanging() {
  return (
    <>
      <Hatch x1={60} x2={140} y={12} up />
      <line x1={100} y1={12} x2={100} y2={62} className={LINE} strokeWidth={2} />
      <rect x={82} y={62} width={36} height={32} rx={3} className={OBJ} strokeWidth={2} />
      <text x={100} y={82} fontSize={11} textAnchor="middle" className={TXT}>
        m
      </text>
    </>
  )
}

function Atwood() {
  return (
    <>
      <Hatch x1={70} x2={130} y={8} up />
      <line x1={100} y1={8} x2={100} y2={36} className={LINE} strokeWidth={2} />
      <circle cx={100} cy={36} r={14} className="fill-surface2 stroke-muted" strokeWidth={2} />
      <circle cx={100} cy={36} r={2} className="fill-muted" />
      <line x1={86} y1={36} x2={86} y2={70} className={LINE} strokeWidth={1.5} />
      <line x1={114} y1={36} x2={114} y2={62} className={LINE} strokeWidth={1.5} />
      <rect x={77} y={70} width={18} height={18} rx={2} className="fill-surface2 stroke-muted" strokeWidth={1.5} />
      <text x={86} y={83} fontSize={9} textAnchor="middle" className="fill-muted font-mono">
        m
      </text>
      <rect x={101} y={62} width={26} height={34} rx={2} className={OBJ} strokeWidth={2} />
      <text x={114} y={83} fontSize={11} textAnchor="middle" className={TXT}>
        M
      </text>
      <SvgArrow x1={142} y1={64} x2={142} y2={96} head={7} className="fill-accel stroke-accel" />
      <text x={148} y={84} fontSize={10} className="fill-accel font-mono">
        a
      </text>
    </>
  )
}

function Elevator() {
  return (
    <>
      <line x1={100} y1={2} x2={100} y2={18} className={LINE} strokeWidth={2} />
      <rect x={60} y={18} width={80} height={94} rx={3} className="fill-surface2 stroke-muted" strokeWidth={2} />
      <line x1={60} y1={108} x2={140} y2={108} className={LINE} strokeWidth={2} />
      <g className="stroke-accent" strokeWidth={2.5} strokeLinecap="round" fill="none">
        <circle cx={100} cy={45} r={7} className="fill-accent/20" />
        <line x1={100} y1={52} x2={100} y2={82} />
        <line x1={88} y1={68} x2={100} y2={60} />
        <line x1={112} y1={68} x2={100} y2={60} />
        <line x1={100} y1={82} x2={92} y2={107} />
        <line x1={100} y1={82} x2={108} y2={107} />
      </g>
      <SvgArrow x1={158} y1={92} x2={158} y2={40} head={7} className="fill-accel stroke-accel" />
      <text x={164} y={70} fontSize={10} className="fill-accel font-mono">
        a
      </text>
    </>
  )
}

const SCENES: Record<FreeBodyPreset, ComponentType> = {
  'block-on-floor-pulled': FloorPulled,
  'block-on-incline': Incline,
  'hanging-mass': Hanging,
  'atwood-machine': Atwood,
  elevator: Elevator,
}

export function ScenarioScene({ id, className, title }: { id: FreeBodyPreset; className?: string; title: string }) {
  const Scene = SCENES[id]
  return (
    <svg viewBox="0 0 200 120" className={cx('h-auto w-full', className)} role="img" aria-label={title}>
      <Scene />
    </svg>
  )
}
