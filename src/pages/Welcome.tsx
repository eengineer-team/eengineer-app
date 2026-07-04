import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { CommunityPreview } from '@/components/CommunityPreview'
import { SettingsMenu } from '@/components/SettingsMenu'
import { Button } from '@/components/ui/button'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0 },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.2 } },
}

// Contrast check:
// #2A2118 on #FFF8DC → relative luminance ~14:1  (WCAG AAA)
// #5C4A1E on #FFF8DC → ~6.5:1                   (WCAG AA large, AA normal)
// #8B6914 on #FFF8DC → ~4.6:1                   (WCAG AA large text / labels only)

const FEATURES = [
  {
    tag: 'Trust',
    title: 'Verifiability',
    description:
      'Every profile is anchored to a real GitHub or LinkedIn account. The network is trusted because it cannot be anonymous.',
  },
  {
    tag: 'Learning',
    title: 'Monthly Webinars',
    description:
      'Discipline-specific sessions — Aerospace, Mechanical, Electrical, Software — hosted by practitioners, not algorithms.',
  },
]

export function Welcome() {
  return (
    <div className="min-h-screen bg-corn-100 flex flex-col">

      {/* Top bar */}
      <header className="flex items-center justify-between px-10 pt-8 pb-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="flex items-center gap-2.5"
        >
          {/* Wordmark */}
          <span className="font-display text-[#2A2118] text-[1.25rem] font-bold tracking-[-0.03em] leading-none">
            ee
          </span>
          <span className="font-sans text-[10px] font-medium tracking-[0.22em] uppercase text-corn-700 mt-px">
            engineer
          </span>
        </motion.div>

        {/* Settings — icon-only, top-right */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <SettingsMenu />
        </motion.div>
      </header>

      {/* Main two-column layout */}
      <main className="flex-1 flex items-center px-10 py-12 gap-16">

        {/* LEFT — text content, ~52% */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="flex-[0_0_52%] max-w-[540px] flex flex-col"
        >
          {/* Eyebrow */}
          <motion.div variants={fadeUp} transition={{ duration: 0.4 }} className="mb-7">
            <span className="font-sans text-[10px] font-medium tracking-[0.22em] uppercase text-corn-700">
              Engineering Network · Verified Builders
            </span>
          </motion.div>

          {/* Headline — Syne Bold, tracking loosened to breathe */}
          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="
              font-display font-bold text-[#2A2118]
              text-[clamp(3.25rem,6.5vw,5.5rem)]
              leading-[0.94] tracking-[-0.01em]
              mb-6
            "
          >
            Just<br />
            Engineer<br />
            It.
          </motion.h1>

          {/* Sub-copy — near-black, not tan */}
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.4 }}
            className="font-sans text-[1rem] leading-[1.65] text-[#2A2118] max-w-[400px] mb-9"
          >
            A verified community for high school engineers.
            Build real projects, connect with peers, find opportunities.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-3.5 mb-12"
          >
            <Button
              asChild
              variant="primary"
              size="lg"
              className="gap-2 font-sans text-[0.8125rem] font-semibold tracking-[0.05em] uppercase"
            >
              <Link to="/auth?mode=signup">
                Sign up
                <ArrowRight size={13} strokeWidth={2.5} />
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="font-sans text-[0.8125rem] font-semibold tracking-[0.05em] uppercase"
            >
              <Link to="/auth?mode=login">Log in</Link>
            </Button>
          </motion.div>

          {/* Features — left accent bar, no numbers */}
          <motion.div variants={stagger} className="space-y-0">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                transition={{ duration: 0.38 }}
              >
                {/* Top rule only on first item */}
                {i === 0 && <div className="h-px bg-[#2A2118]/10 mb-5" />}

                <div className="flex gap-5 pb-5">
                  {/* Left accent bar — amber, 2px, not a number */}
                  <div className="w-0.5 flex-shrink-0 bg-corn-700 self-stretch rounded-full" />

                  <div>
                    {/* Category tag */}
                    <span className="font-sans text-[10px] font-medium tracking-[0.18em] uppercase text-corn-700 block mb-1.5">
                      {f.tag}
                    </span>
                    <h2 className="font-sans text-[0.9375rem] font-semibold text-[#2A2118] tracking-tight mb-1.5">
                      {f.title}
                    </h2>
                    <p className="font-sans text-[0.875rem] leading-[1.6] text-[#2A2118] max-w-[360px]">
                      {f.description}
                    </p>
                  </div>
                </div>

                <div className="h-px bg-[#2A2118]/10 mb-5" />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* RIGHT — product artifact, ~48%. Generous top space above the card
            is intentional breathing room, not a placeholder for future filler —
            stays empty until Community/Opportunities (Step 7-8) land real content. */}
        <div className="flex-1 flex flex-col items-center justify-start min-w-0 pt-32">
          <CommunityPreview />
        </div>

      </main>

      {/* Footer — contact, unchanged email */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 1.0 }}
        className="relative z-10 px-10 pb-8 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <span className="font-sans text-[10px] font-medium tracking-[0.18em] uppercase text-corn-700">
            Contact
          </span>
          <span className="w-6 h-px bg-corn-700/35" />
          <a
            href="mailto:bshoxrux48@gmail.com"
            className="font-sans text-[0.8125rem] text-[#2A2118] hover:text-corn-700 underline underline-offset-2 decoration-[#2A2118]/25 hover:decoration-corn-700 transition-colors"
          >
            bshoxrux48@gmail.com
          </a>
        </div>
        <span className="font-sans text-[10px] text-corn-700">© 2026</span>
      </motion.footer>
    </div>
  )
}
