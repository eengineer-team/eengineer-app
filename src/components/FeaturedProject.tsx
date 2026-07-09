import { motion } from 'framer-motion'
import { FileText, Share2, MessageSquareText, Rocket as ShipIcon } from 'lucide-react'
import { Chip } from '@/components/ui/chip'

// Simple line-art model rocket — stands in for a real photo (no licensed
// stock image available offline). Tilted via the wrapper's rotate transform,
// same idea as the reference "featured project card" mockup.
function ModelRocketArt() {
  return (
    <svg viewBox="0 0 200 260" className="w-full h-full">
      <defs>
        <linearGradient id="rocketBody" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#E8DFC0" />
          <stop offset="100%" stopColor="#C9BC8E" />
        </linearGradient>
      </defs>
      <rect width="200" height="260" fill="#1A1208" />
      {/* Fins */}
      <path d="M85 190 L55 235 L85 225 Z" fill="#8B6914" />
      <path d="M115 190 L145 235 L115 225 Z" fill="#8B6914" />
      {/* Body */}
      <rect x="82" y="60" width="36" height="140" rx="6" fill="url(#rocketBody)" />
      {/* Nose cone */}
      <path d="M82 60 L100 15 L118 60 Z" fill="#D4C66A" />
      {/* Window */}
      <circle cx="100" cy="105" r="10" fill="#1A1208" opacity="0.5" />
      <circle cx="100" cy="105" r="10" fill="none" stroke="#8B6914" strokeWidth="2" />
      {/* Stripe */}
      <rect x="82" y="150" width="36" height="8" fill="#8B6914" />
      {/* Exhaust */}
      <path d="M88 200 L100 240 L112 200 Z" fill="#D4C66A" opacity="0.55" />
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
        {/* Left — tilted featured project card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="flex justify-center"
        >
          <div
            className="w-full max-w-[300px] rounded-xl border border-corn-900/10 bg-white/70 overflow-hidden shadow-[0_20px_50px_-20px_rgba(26,18,8,0.35)]"
            style={{ transform: 'rotate(-4deg)' }}
          >
            <div className="aspect-[4/3]">
              <ModelRocketArt />
            </div>
            <div className="p-4">
              <span className="font-sans text-[10px] font-medium tracking-[0.16em] uppercase text-corn-700 block mb-1.5">
                Featured this week
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
