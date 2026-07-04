import { motion } from 'framer-motion'

// Rotating wireframe polyhedra + circuit-trace paths
// Color palette: warm amber/tan on cornsilk — #C4A55A, #D4B86A, #8B6914, #5C4A1E at low opacity

const SHAPES = [
  {
    // Hexagon wireframe
    points: '50,10 90,32 90,68 50,90 10,68 10,32',
    cx: 50, cy: 50,
    size: 80,
    speed: 22,
    opacity: 0.12,
    color: '#8B6914',
    strokeWidth: 1,
    top: '8%', left: '62%',
  },
  {
    points: '50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5',
    cx: 50, cy: 50,
    size: 130,
    speed: 34,
    opacity: 0.07,
    color: '#5C4A1E',
    strokeWidth: 0.7,
    top: '45%', left: '75%',
  },
  {
    points: '50,10 90,32 90,68 50,90 10,68 10,32',
    cx: 50, cy: 50,
    size: 55,
    speed: 18,
    opacity: 0.15,
    color: '#8B6914',
    strokeWidth: 1.2,
    top: '72%', left: '55%',
  },
  {
    // Triangle wireframe
    points: '50,8 92,80 8,80',
    cx: 50, cy: 56,
    size: 70,
    speed: 28,
    opacity: 0.09,
    color: '#B5A23A',
    strokeWidth: 0.8,
    top: '22%', left: '82%',
  },
]

// Organic circuit-trace SVG paths
const TRACES = [
  { d: 'M 20 180 L 80 180 L 80 120 L 160 120 L 160 60 L 240 60', delay: 0 },
  { d: 'M 0 300 L 60 300 L 60 240 Q 60 200 100 200 L 200 200 L 200 140', delay: 0.4 },
  { d: 'M 40 400 L 40 340 L 120 340 L 120 280 L 200 280 L 200 200 L 280 200', delay: 0.8 },
  { d: 'M 100 500 L 100 440 Q 100 400 140 400 L 260 400 L 260 320', delay: 1.2 },
]

// Floating dots — solder points on circuit traces
const DOTS = [
  { cx: 80, cy: 120, delay: 0.3 },
  { cx: 160, cy: 60, delay: 0.7 },
  { cx: 60, cy: 240, delay: 0.5 },
  { cx: 200, cy: 140, delay: 1.0 },
  { cx: 120, cy: 340, delay: 0.9 },
  { cx: 200, cy: 280, delay: 1.3 },
  { cx: 260, cy: 320, delay: 1.5 },
]

export function EngineeringCanvas() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Circuit traces — bottom-right quadrant */}
      <svg
        className="absolute"
        style={{ right: 0, top: 0, width: '340px', height: '540px', opacity: 0.13 }}
        viewBox="0 0 340 540"
        fill="none"
      >
        {TRACES.map((trace, i) => (
          <motion.path
            key={i}
            d={trace.d}
            stroke="#8B6914"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.2, delay: trace.delay, ease: 'easeOut' }}
          />
        ))}
        {DOTS.map((dot, i) => (
          <motion.circle
            key={i}
            cx={dot.cx}
            cy={dot.cy}
            r="3"
            fill="#8B6914"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: dot.delay + 1.8, ease: 'backOut' }}
          />
        ))}
      </svg>

      {/* Rotating wireframe polyhedra */}
      {SHAPES.map((shape, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ top: shape.top, left: shape.left }}
          animate={{ rotate: 360 }}
          transition={{
            duration: shape.speed,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <svg
            width={shape.size}
            height={shape.size}
            viewBox="0 0 100 100"
            fill="none"
            style={{ opacity: shape.opacity }}
          >
            <polygon
              points={shape.points}
              stroke={shape.color}
              strokeWidth={shape.strokeWidth}
              fill="none"
            />
            {/* Inner cross lines — gives depth/wireframe feel */}
            <line
              x1="10" y1="32" x2="90" y2="68"
              stroke={shape.color}
              strokeWidth={shape.strokeWidth * 0.6}
            />
            <line
              x1="90" y1="32" x2="10" y2="68"
              stroke={shape.color}
              strokeWidth={shape.strokeWidth * 0.6}
            />
          </svg>
        </motion.div>
      ))}

      {/* Slow-drift measurement brackets — editorial texture */}
      <motion.svg
        className="absolute"
        style={{ right: '8%', bottom: '15%', opacity: 0.08 }}
        width="120"
        height="80"
        viewBox="0 0 120 80"
        fill="none"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M 10 10 L 10 70 L 110 70" stroke="#5C4A1E" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 10 10 L 18 10" stroke="#5C4A1E" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 110 70 L 110 62" stroke="#5C4A1E" strokeWidth="1.5" strokeLinecap="round" />
        {/* Tick marks on axis */}
        {[30, 50, 70, 90].map((x) => (
          <line key={x} x1={x} y1="66" x2={x} y2="74" stroke="#5C4A1E" strokeWidth="1" />
        ))}
        {[25, 42, 59].map((y) => (
          <line key={y} x1="6" y1={y} x2="14" y2={y} stroke="#5C4A1E" strokeWidth="1" />
        ))}
      </motion.svg>

      {/* Floating ring — structural elegance */}
      <motion.svg
        className="absolute"
        style={{ right: '18%', top: '10%', opacity: 0.06 }}
        width="160"
        height="160"
        viewBox="0 0 160 160"
        fill="none"
        animate={{ rotate: -360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      >
        <circle cx="80" cy="80" r="70" stroke="#8B6914" strokeWidth="1" strokeDasharray="6 4" />
        <circle cx="80" cy="80" r="50" stroke="#B5A23A" strokeWidth="0.7" />
        <circle cx="80" cy="80" r="4" fill="#8B6914" opacity="0.4" />
      </motion.svg>
    </div>
  )
}
