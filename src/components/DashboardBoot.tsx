import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'

// Brand "boot" preview before the dashboard: a dark engineering sheet on which a
// blueprint draws itself stroke by stroke — a rocket, a bridge truss, or a hex
// nut, chosen at random each load — with dimension lines, plotted vertices, a
// live count-up, and a real drawing title block. Held a minimum beat by
// Dashboard.tsx so it plays as an intentional intro.

interface Blueprint {
  label: string
  paths: string[]
  verts: [number, number][]
  dim: { line: string; ticks: string; value: string }
}

const BLUEPRINTS: Blueprint[] = [
  {
    label: 'AEROSPACE · fig. R-1',
    paths: [
      'M110 22 C130 44 130 68 130 100 L130 158 L90 158 L90 100 C90 68 90 44 110 22 Z',
      'M90 134 L62 176 L90 158',
      'M130 134 L158 176 L130 158',
      'M94 158 L98 180 L122 180 L126 158',
      'M110 80 m-12 0 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0',
    ],
    verts: [[110, 22], [130, 100], [90, 100], [62, 176], [158, 176]],
    dim: { line: 'M166 22 V180', ticks: 'M161 22 H171 M161 180 H171', value: '158 mm' },
  },
  {
    label: 'CIVIL · fig. T-2',
    paths: [
      'M28 156 H182',
      'M64 96 H146',
      'M28 156 L64 96',
      'M182 156 L146 96',
      'M64 96 V156',
      'M105 96 V156',
      'M146 96 V156',
      'M64 96 L105 156',
      'M146 96 L105 156',
    ],
    verts: [[28, 156], [182, 156], [64, 96], [146, 96], [105, 96], [105, 156]],
    dim: { line: 'M28 176 H182', ticks: 'M28 171 V181 M182 171 V181', value: '154 mm' },
  },
  {
    label: 'MECHANICAL · fig. N-3',
    paths: [
      'M105 40 L157 70 L157 130 L105 160 L53 130 L53 70 Z',
      'M105 72 m-30 0 a30 30 0 1 0 60 0 a30 30 0 1 0 -60 0',
    ],
    verts: [[105, 40], [157, 70], [157, 130], [105, 160], [53, 130], [53, 70]],
    dim: { line: 'M172 40 V160', ticks: 'M167 40 H177 M167 160 H177', value: 'M20' },
  },
]

const PHRASES = ['reading the blueprint', 'checking tolerances', 'squaring the frame', 'torquing to spec']

export function DashboardBoot() {
  const bp = useMemo(() => BLUEPRINTS[Math.floor(Math.random() * BLUEPRINTS.length)], [])
  const [pct, setPct] = useState(0)
  const [phrase, setPhrase] = useState(0)
  const done = pct >= 100

  useEffect(() => {
    const start = performance.now()
    const DUR = 1500
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / DUR)
      setPct(Math.round(p * 100))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const pi = window.setInterval(() => setPhrase((i) => (i + 1) % PHRASES.length), 460)
    return () => {
      cancelAnimationFrame(raf)
      clearInterval(pi)
    }
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-dark-radial text-gold-dark">
      {/* engineer's grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(245,240,223,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(245,240,223,0.035) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* drawing-sheet frame + corner ticks */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="pointer-events-none absolute inset-4 sm:inset-6 border border-gold-dark/25"
      >
        {[
          'top-0 left-0 border-t-2 border-l-2',
          'top-0 right-0 border-t-2 border-r-2',
          'bottom-0 left-0 border-b-2 border-l-2',
          'bottom-0 right-0 border-b-2 border-r-2',
        ].map((c) => (
          <span key={c} className={`absolute w-4 h-4 border-gold-dark/60 ${c}`} />
        ))}
      </motion.div>

      {/* the blueprint, centre stage */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.svg
          width="330"
          height="330"
          viewBox="0 0 210 210"
          fill="none"
          aria-hidden="true"
          className="text-gold-dark max-w-[70vw] max-h-[55vh]"
          animate={done ? { scale: [1, 1.03, 1] } : { scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ filter: done ? 'drop-shadow(0 0 10px rgba(199,154,58,0.35))' : 'none' }}
        >
          {/* dimension line */}
          <path d={bp.dim.ticks} stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <motion.path
            d={bp.dim.line}
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          />
          {/* structure strokes, drawn in sequence */}
          {bp.paths.map((d, i) => (
            <motion.path
              key={i}
              d={d}
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.7, delay: 0.25 + i * 0.16, ease: 'easeInOut' }}
            />
          ))}
          {/* plotted vertices pop after the lines */}
          {bp.verts.map(([x, y], i) => (
            <motion.circle
              key={`${x}-${y}`}
              cx={x}
              cy={y}
              r="2.6"
              className="fill-dark-900 stroke-gold-dark"
              strokeWidth="1.4"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.7 + i * 0.08, type: 'spring', stiffness: 500, damping: 22 }}
              style={{ transformOrigin: `${x}px ${y}px` }}
            />
          ))}
        </motion.svg>
      </div>

      {/* rotating caption, centred low */}
      <div className="absolute left-0 right-0 bottom-24 flex justify-center">
        <span className="font-sans italic text-[13px] tracking-wide text-dark-muted">
          {done ? 'ready' : PHRASES[phrase]}
        </span>
      </div>

      {/* title block — like a real drawing's, bottom-right */}
      <div className="absolute bottom-6 right-6 sm:bottom-9 sm:right-9 border border-gold-dark/40 bg-dark-900/40 backdrop-blur-sm">
        <div className="flex divide-x divide-gold-dark/30">
          <div className="px-3 py-2">
            <div className="font-sans text-[9px] tracking-[0.2em] uppercase text-dark-muted">Drawing</div>
            <div className="font-display text-[13px] font-bold text-dark-text leading-tight">eengineer</div>
          </div>
          <div className="px-3 py-2">
            <div className="font-sans text-[9px] tracking-[0.2em] uppercase text-dark-muted">{bp.label}</div>
            <div className="font-display text-[13px] font-bold text-gold-dark leading-tight tabular-nums">
              {pct}% · {bp.dim.value}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
