import { motion } from 'framer-motion'
import { MessageCircleQuestion } from 'lucide-react'

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

function TrustMark() {
  return (
    <div className="relative w-16 h-16 flex items-center justify-center mb-5">
      <div className="absolute w-11 h-11 rounded-xl bg-[#24292e] text-white flex items-center justify-center rotate-[-12deg] shadow-[0_6px_16px_rgba(0,0,0,0.18)] -translate-x-2.5">
        <GithubMark className="w-6 h-6" />
      </div>
      <div className="absolute w-11 h-11 rounded-xl bg-[#0A66C2] text-white flex items-center justify-center rotate-[12deg] shadow-[0_6px_16px_rgba(0,0,0,0.18)] translate-x-2.5">
        <LinkedinMark className="w-6 h-6" />
      </div>
    </div>
  )
}

// Two features, not five (07.2026 edit pass, rule: "does the element say
// something that exists nowhere else on the page?"). The cut three either
// duplicated sections below (Projects → FeaturedProject loop, Calendar →
// LandingCalendar) or said nothing ("Networking"). What's left is the two
// claims no other section makes.
const FEATURES = [
  {
    tag: 'Verification',
    title: 'Signup requires GitHub or LinkedIn',
    description:
      "There is no email-only registration. Whoever comments on your project has a public identity and a work history you can check yourself.",
    visual: 'trust' as const,
  },
  {
    tag: 'Q&A',
    title: 'Questions go to people, not a model',
    description:
      'Ask your discipline group, and the answer comes from a member with builds behind them — not from a chatbot predicting what an answer should look like.',
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

export function LandingFeatures() {
  return (
    <section className="px-5 sm:px-10 py-16 border-t border-[#2A2118]/8">
      <div className="max-w-[640px] mb-12">
        <span className="font-sans text-[11px] font-medium tracking-[0.16em] uppercase text-corn-700 block mb-3">
          Why eengineer
        </span>
        <h2 className="font-display font-extrabold text-[#2A2118] text-[clamp(2rem,3.8vw,2.75rem)] leading-[1.05] tracking-[-0.02em]">
          No anonymous accounts. No bot answers.
        </h2>
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10 max-w-[880px]"
      >
        {FEATURES.map((f) => (
          <motion.div key={f.tag} variants={fadeUp} transition={{ duration: 0.4 }} className="flex flex-col">
            {f.visual === 'trust' ? (
              <TrustMark />
            ) : (
              f.Icon && (
                <div className="w-16 h-16 rounded-xl bg-corn-900/6 border border-corn-900/10 flex items-center justify-center mb-5">
                  <f.Icon size={26} strokeWidth={1.6} className="text-corn-700" />
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
