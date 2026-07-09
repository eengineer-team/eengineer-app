import { motion } from 'framer-motion'
import { FolderGit2, Users2, CalendarDays, MessageCircleQuestion } from 'lucide-react'

// Brand marks — lucide-react has no GitHub/LinkedIn logos, so these are the
// same inline SVGs TeamAbout.tsx uses, just bigger and given a slight lean
// against each other per the founder's reference ("show the logos of Github
// and Linkedin leaning on each other as a picture above").
function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.207 11.387.6.113.793-.26.793-.577 0-.285-.01-1.04-.016-2.04-3.338.725-4.042-1.61-4.042-1.61-.546-1.386-1.332-1.756-1.332-1.756-1.089-.744.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.42-1.305.763-1.605-2.665-.303-5.467-1.332-5.467-5.93 0-1.31.469-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.3 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.655 1.652.243 2.873.12 3.176.77.84 1.235 1.911 1.235 3.221 0 4.61-2.807 5.624-5.48 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .32.192.694.801.576C20.566 21.795 24 17.298 24 12c0-6.63-5.37-12-12-12Z" />
    </svg>
  )
}

function LinkedinMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124ZM7.114 20.452H3.558V9h3.556v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
    </svg>
  )
}

// Enlarged + given a glossy highlight overlay per founder's literal request
// ("logos should be made bigger and more realistic") — scoped-override only,
// see LandingFeatures header comment.
function TrustMark() {
  return (
    <div className="relative w-24 h-24 flex items-center justify-center mb-5">
      <div className="absolute w-16 h-16 rounded-2xl bg-[#24292e] text-white flex items-center justify-center rotate-[-12deg] shadow-[0_10px_24px_rgba(0,0,0,0.28)] -translate-x-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent" />
        <GithubMark className="w-9 h-9 relative" />
      </div>
      <div className="absolute w-16 h-16 rounded-2xl bg-[#0A66C2] text-white flex items-center justify-center rotate-[12deg] shadow-[0_10px_24px_rgba(0,0,0,0.28)] translate-x-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent" />
        <LinkedinMark className="w-9 h-9 relative" />
      </div>
    </div>
  )
}

const FEATURES = [
  {
    tag: 'Trust',
    title: 'Every profile, verified',
    description: 'Every profile is registered through a GitHub or LinkedIn account. Because of this, the network is trusted.',
    visual: 'trust' as const,
  },
  {
    tag: 'Projects',
    title: 'Ship, get real feedback',
    description: 'Post your projects to receive honest peer feedback, find new team members, and more.',
    visual: 'icon' as const,
    Icon: FolderGit2,
  },
  {
    tag: 'Networking',
    title: 'Meet future engineers',
    description: 'One of the best communities to offer networking opportunities with future engineers.',
    visual: 'icon' as const,
    Icon: Users2,
  },
  {
    tag: 'Competition Calendar',
    title: 'Never miss a deadline',
    description: "Get notified about upcoming competitions and opportunities for your chosen field.",
    visual: 'icon' as const,
    Icon: CalendarDays,
  },
  {
    tag: 'QAs',
    title: 'Ask real people',
    description: 'Instead of asking a chatbot with no real experience, ask real people — their answers may resonate better.',
    visual: 'icon' as const,
    Icon: MessageCircleQuestion,
  },
]

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

// SCOPED OVERRIDE — founder-risky-edits branch only (09.07.2026). Normal
// project rules reject 21st.dev components/templates as a visual reference
// (docs/ai-agent-build-instructions.md, Шаг 1.5 preamble). Founder explicitly
// asked to see the literal ask built anyway, for side-by-side comparison
// against main: "rebuild it to match the layout of
// 21st.dev/@tailark/components/features-2: horizontal feature list, GitHub/
// LinkedIn logos bigger and more realistic." This is that literal build —
// full-width single row with vertical hairline dividers instead of the
// previous 5-up card grid. Not a recommendation; see commit message for the
// usability critique. Do not use this component as precedent elsewhere.
export function LandingFeatures() {
  return (
    <section className="px-5 sm:px-10 py-16 border-t border-[#2A2118]/8">
      <div className="max-w-[640px] mb-12">
        <span className="font-sans text-[11px] font-medium tracking-[0.16em] uppercase text-corn-700 block mb-3">
          Why eengineer
        </span>
        <h2 className="font-display font-extrabold text-[#2A2118] text-[clamp(2rem,3.8vw,2.75rem)] leading-[1.05] tracking-[-0.02em]">
          Everything you need, none of the noise.
        </h2>
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        className="flex flex-col lg:flex-row border-t border-b border-corn-900/10 lg:divide-x lg:divide-corn-900/10"
      >
        {FEATURES.map((f) => (
          <motion.div
            key={f.tag}
            variants={fadeUp}
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col items-start px-0 lg:px-6 py-8 border-b lg:border-b-0 border-corn-900/10 last:border-b-0"
          >
            {f.visual === 'trust' ? (
              <TrustMark />
            ) : (
              f.Icon && (
                <div className="mb-5">
                  <f.Icon size={40} strokeWidth={1.4} className="text-corn-700" />
                </div>
              )
            )}
            <span className="font-sans text-[10px] font-medium tracking-[0.18em] uppercase text-corn-700 mb-1.5">
              {f.tag}
            </span>
            <h3 className="font-sans text-[0.9375rem] font-semibold text-[#2A2118] tracking-tight mb-1.5">
              {f.title}
            </h3>
            <p className="font-sans text-[0.8125rem] leading-[1.6] text-[#2A2118]/80">
              {f.description}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
