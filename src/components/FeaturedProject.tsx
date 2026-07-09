import { motion } from 'framer-motion'
import { FileText, Share2, MessageSquareText, Rocket as ShipIcon } from 'lucide-react'
import { Chip } from '@/components/ui/chip'

// Engineer's-notebook sketch of a model rocket (notebook pass, 07.2026 —
// replaced the old flat-color art on a dark panel). Stroke-only "pencil"
// line work with drawing conventions a builder would recognize: a dash-dot
// centerline, cross-hatched fins, and a dimension callout. Still a stand-in
// until a real user project exists — the card's label says so.
function ModelRocketArt() {
  const ink = '#2A2118'
  const dim = '#8B6914'
  return (
    <svg viewBox="0 0 200 260" className="w-full h-full" role="img" aria-label="Technical sketch of a model rocket">
      {/* Centerline — dash-dot, the classic axis convention */}
      <path d="M100 8v244" stroke={ink} strokeWidth="0.75" strokeDasharray="9 4 2 4" opacity="0.3" />

      {/* Nose cone */}
      <path d="M84 62 Q100 14 116 62" stroke={ink} strokeWidth="1.5" fill="none" opacity="0.8" />
      {/* Body */}
      <path d="M84 62v134M116 62v134M84 196h32M84 62h32" stroke={ink} strokeWidth="1.5" fill="none" opacity="0.8" />
      {/* Window */}
      <circle cx="100" cy="102" r="9" stroke={ink} strokeWidth="1.25" fill="none" opacity="0.8" />
      <circle cx="100" cy="102" r="5" stroke={ink} strokeWidth="0.75" fill="none" opacity="0.4" />
      {/* Stripe */}
      <path d="M84 150h32M84 158h32" stroke={ink} strokeWidth="1" opacity="0.55" />
      {/* Fins — outlined, cross-hatched */}
      <path d="M84 186 L56 232 L84 222 Z" stroke={ink} strokeWidth="1.5" fill="none" opacity="0.8" />
      <path d="M116 186 L144 232 L116 222 Z" stroke={ink} strokeWidth="1.5" fill="none" opacity="0.8" />
      <path d="M78 198l-12 20M74 206l-9 15M70 214l-6 10" stroke={ink} strokeWidth="0.75" opacity="0.35" />
      <path d="M122 198l12 20M126 206l9 15M130 214l6 10" stroke={ink} strokeWidth="0.75" opacity="0.35" />
      {/* Exhaust — loose pencil strokes */}
      <path d="M92 200q4 22 8 34M108 200q-4 22-8 34M100 202v26" stroke={ink} strokeWidth="0.75" strokeDasharray="3 4" opacity="0.35" fill="none" />

      {/* Dimension callout — body length */}
      <path d="M132 62h18M132 196h18" stroke={dim} strokeWidth="0.75" opacity="0.9" />
      <path d="M146 62v134" stroke={dim} strokeWidth="0.75" opacity="0.9" />
      <path d="M143 70l3-8 3 8M143 188l3 8 3-8" stroke={dim} strokeWidth="0.75" fill="none" opacity="0.9" />
      <text x="153" y="132" fill={dim} fontSize="8.5" fontStyle="italic" fontFamily="'Space Grotesk', sans-serif">
        240 mm
      </text>
    </svg>
  )
}

const STEPS = [
  { label: 'Document', Icon: FileText, description: 'Write up what you built and why.' },
  { label: 'Share', Icon: Share2, description: 'Post it to your discipline community.' },
  { label: 'Feedback', Icon: MessageSquareText, description: 'Real builders weigh in — no bots.' },
  { label: 'Ship', Icon: ShipIcon, description: 'Iterate, and put it out into the world.' },
]

export function FeaturedProject() {
  return (
    <section className="px-5 sm:px-10 py-16 border-t border-[#2A2118]/8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left — example project card. Untilted (07.2026 edit pass: the
            rotate was pure decoration) and labeled "Example project", not
            "Featured this week" — the content is illustrative until real
            user projects exist, and the label shouldn't pretend otherwise. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="flex justify-center"
        >
          <div className="w-full max-w-[300px] rounded-xl border border-corn-900/10 bg-white/70 overflow-hidden shadow-[0_20px_50px_-20px_rgba(26,18,8,0.35)]">
            <div className="aspect-[4/3] bg-graph-paper border-b border-corn-900/8">
              <ModelRocketArt />
            </div>
            <div className="p-4">
              <span className="font-sans italic text-[0.75rem] text-corn-700 block mb-1.5">
                fig. 1 — an example project
              </span>
              <h3 className="font-sans text-[0.9375rem] font-semibold text-[#2A2118] mb-1.5">
                Active-Fin Model Rocket Stabilizer
              </h3>
              <p className="font-sans text-[0.8125rem] leading-snug text-[#2A2118]/75 mb-3">
                A PID-controlled fin system that keeps a model rocket on axis through powered ascent.
              </p>
              <Chip theme="welcome">Aerospace</Chip>
            </div>
          </div>
        </motion.div>

        {/* Right — the core loop */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <span className="font-sans text-[11px] font-medium tracking-[0.16em] uppercase text-corn-700 block mb-3">
            How it works
          </span>
          <h2 className="font-display font-extrabold text-[#2A2118] text-[clamp(1.75rem,3.2vw,2.25rem)] leading-[1.1] tracking-[-0.02em] mb-8">
            One loop. Every project.
          </h2>

          <div className="flex flex-col gap-0">
            {STEPS.map((step, i) => (
              <div key={step.label} className="flex gap-4">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-9 h-9 rounded-full bg-corn-900 text-corn-100 flex items-center justify-center">
                    <step.Icon size={16} strokeWidth={1.8} />
                  </div>
                  {i < STEPS.length - 1 && <div className="w-px flex-1 bg-corn-900/15 my-1" />}
                </div>
                <div className="pb-8">
                  <div className="font-sans text-[0.9375rem] font-semibold text-[#2A2118] mb-0.5">
                    {step.label}
                  </div>
                  <p className="font-sans text-[0.8125rem] text-[#2A2118]/70 leading-snug">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
