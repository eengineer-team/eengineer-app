import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { TeamAbout } from '@/components/TeamAbout'
import { LandingFeatures } from '@/components/LandingFeatures'
import { FeaturedProject } from '@/components/FeaturedProject'
import { LandingCalendar } from '@/components/LandingCalendar'
import { SettingsMenu } from '@/components/SettingsMenu'
import { FeedbackMenu } from '@/components/FeedbackMenu'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/ui/wordmark'
import { LabelCaps } from '@/components/ui/label-caps'
import { useCursorSpotlight } from '@/lib/use-cursor-spotlight'

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

export function Welcome() {
  // Cursor-reactive graph paper: base grid stays calm, a bolder copy of the
  // same grid is revealed in a soft radius under the pointer (desktop only,
  // respects reduced-motion). Ref goes on the hero <main> carrying .bg-graph-paper.
  const heroRef = useCursorSpotlight<HTMLElement>()

  return (
    <div className="min-h-screen bg-corn-100 flex flex-col">

      {/* Top bar */}
      <header className="flex items-center justify-between px-5 sm:px-10 pt-6 sm:pt-8 pb-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="flex items-center"
        >
          <Wordmark variant="light" />
        </motion.div>

        {/* Feedback + Settings — icon-only, top-right */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex items-center gap-1"
        >
          <FeedbackMenu />
          <SettingsMenu />
        </motion.div>
      </header>

      {/* Hero — deliberately just type on cornsilk: no screenshot, no video,
          no mock artifact. Team decision (07.2026): while the product runs on
          seed data, any "product shot" here is a fabrication; empty is more
          honest and reads stronger. Revisit only when there are real screens
          with real user content to show. */}
      <main
        ref={heroRef}
        className="relative isolate flex-1 flex flex-col px-5 sm:px-10 py-10 lg:py-12 bg-graph-paper"
      >
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="relative z-10 w-full max-w-[820px] flex flex-col"
        >

          {/* Headline — now on the "display" token (tailwind.config.js) instead
              of a one-off arbitrary clamp: moderately larger cap + positive
              tracking per founder request, still capped so it doesn't go
              "giant" on very wide viewports. */}
          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="font-display text-display text-[#2A2118] mb-6"
          >
            Just<br />
            Engineer<br />
            It.
          </motion.h1>

          {/* Dimension line — the one allowed brand gesture (notebook pass,
              07.2026). Drawn like a technical-drawing measurement under the
              headline. If you're tempted to add a second gesture like this
              somewhere else: don't — one is a signature, two is a theme park. */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2.5 text-corn-700 -mt-1 mb-7"
            aria-hidden="true"
          >
            {/* Draws itself in once on load — reuses the `draw` keyframe
                (tailwind.config.js), same mechanism as the technical-drawing
                dimension line it's meant to evoke. Ticks/baseline first, then
                the arrowheads, so it reads as one continuous stroke. */}
            <svg width="150" height="12" viewBox="0 0 150 12" fill="none" className="flex-shrink-0">
              <path
                d="M1 1v10M149 1v10"
                stroke="currentColor"
                strokeWidth="1"
                pathLength={1000}
                strokeDasharray={1000}
                className="animate-draw motion-reduce:animate-none"
              />
              <path
                d="M1 6h148"
                stroke="currentColor"
                strokeWidth="1"
                pathLength={1000}
                strokeDasharray={1000}
                className="animate-draw motion-reduce:animate-none"
              />
              <path
                d="M8 3L2 6l6 3M142 3l6 3-6 3"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
                pathLength={1000}
                strokeDasharray={1000}
                style={{ animationDelay: '250ms' }}
                className="animate-draw motion-reduce:animate-none"
              />
            </svg>
            <span className="font-sans italic text-[0.75rem] tracking-wide">
              fig. 0 — the whole idea
            </span>
          </motion.div>

          {/* Sub-copy — near-black, not tan */}
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.4 }}
            className="font-sans text-[1rem] leading-[1.65] text-[#2A2118] max-w-[460px] mb-9"
          >
            Every profile here is tied to a real GitHub or LinkedIn account — no anonymous
            feedback, no bots. Post what you're building across nine disciplines, from model
            rockets to bridges, and track every competition deadline in your field.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-3.5"
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
        </motion.div>
      </main>

      <LandingFeatures />

      <FeaturedProject />

      {/* Competition Calendar — left-aligned block, not centered/full-width,
          per founder spec ("must be in the middle left of the landing page"). */}
      <section className="px-5 sm:px-10 py-16 border-t border-[#2A2118]/8">
        <div className="max-w-[640px] mb-8">
          <LabelCaps theme="welcome" className="block mb-3">
            Stay ahead
          </LabelCaps>
          <h2 className="font-display font-extrabold text-[#2A2118] text-[clamp(1.75rem,3.2vw,2.25rem)] leading-[1.1] tracking-[-0.02em]">
            Every deadline that matters, in one place.
          </h2>
        </div>
        <LandingCalendar />
      </section>

      <TeamAbout />

      {/* Footer — contact, unchanged email */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 1.0 }}
        className="relative z-10 px-5 sm:px-10 pb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <LabelCaps theme="welcome">Contact</LabelCaps>
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
