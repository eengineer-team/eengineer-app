import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { SettingsMenu } from '@/components/SettingsMenu'
import { Wordmark } from '@/components/ui/wordmark'
import { LabelCaps } from '@/components/ui/label-caps'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'

// Conversational tone — matches the voice of the landing page trust block.
// Not formal/ToS language. Speaks to a high school engineer directly.
const FAQ = [
  {
    id: 'q1',
    question: 'What is this platform about?',
    answer:
      "It's a network for high school engineers who are actually building things — not doing homework. You join your discipline's community: Aerospace, Mechanical, Electrical, Software, Civil. From there you post real projects, ask questions that matter, attend webinars run by people in the field, and connect with peers who are working on the same problems. Every profile is tied to a real GitHub or LinkedIn account, so you know you're talking to an actual person.",
  },
  {
    id: 'q2',
    question: 'What is the aim?',
    answer:
      "To give serious high school engineers somewhere the work speaks for itself. You don't need a GPA or a credential to show what you can do — you need a project, a skill, and people who can vouch for it. By the time you leave high school, you should have a verifiable track record: documented projects, real connections, and endorsements from people who've seen your work. That follows you into university, internships, and whatever comes next.",
  },
  {
    id: 'q3',
    question: 'Why sign up through GitHub or LinkedIn?',
    answer:
      "Because anyone can make an email account in two minutes. GitHub and LinkedIn verify that there's a real person with a real engineering presence behind the profile. We don't pull in your posts, your connections, or anything else from those platforms — just confirmation that you exist and you're a builder. We don't store that data either. It's purely an identity signal. That's what makes it possible to build a network that isn't full of noise.",
  },
  {
    id: 'q4',
    question: 'How does this help high school engineering students?',
    answer:
      "Most platforms weren't built for you. They're built for professionals who already have the credentials. eengineer is for the stretch before that — when you're teaching yourself, entering competitions, doing side projects, and trying to find the right internship without knowing where to look. Monthly webinars from practitioners in your field. A competition calendar so you don't miss deadlines. Real internship and research listings filtered to your discipline. Document the work now, so it counts later.",
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0 },
}

// Same email as footer/landing — consistency until domain decision is finalized
const CONTACT_EMAIL = 'bshoxrux48@gmail.com'

export function Help() {
  return (
    <div className="min-h-screen bg-corn-100 flex flex-col">

      {/* Header — same pattern as Welcome */}
      <header className="flex items-center justify-between px-10 pt-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Link to="/" className="flex items-center group">
            <Wordmark variant="light" className="transition-opacity group-hover:opacity-70" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.08 }}
        >
          <SettingsMenu />
        </motion.div>
      </header>

      {/* Back */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.12 }}
        className="px-10 pt-7"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 font-sans text-[0.8125rem] text-corn-700 hover:text-[#2A2118] transition-colors"
        >
          <ArrowLeft size={13} strokeWidth={2} />
          Back
        </Link>
      </motion.div>

      {/* Main */}
      <main className="flex-1 px-10 pt-8 pb-16">

        {/* Two-column title row: heading left, contact prompt right */}
        <div className="flex items-start justify-between gap-8 mb-10">

          {/* Left: eyebrow + title */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.35, delay: 0.18 }}
          >
            <LabelCaps theme="welcome" className="block mb-5">
              Help · FAQ
            </LabelCaps>
            <h1 className="font-display font-bold text-[#2A2118] text-[clamp(2rem,3.8vw,2.75rem)] leading-[1.0] tracking-[-0.02em]">
              Frequently<br />Asked Questions
            </h1>
          </motion.div>

          {/* Right: contact prompt — fills dead space next to title */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.28 }}
            className="flex-shrink-0 pt-7 text-right"
          >
            <p className="font-sans text-[0.8125rem] text-[#2A2118] mb-2">
              Didn't find an answer?
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-1 font-sans text-[0.8125rem] font-semibold text-corn-700 hover:text-[#2A2118] transition-colors underline underline-offset-2 decoration-corn-700/40 hover:decoration-[#2A2118]"
            >
              {CONTACT_EMAIL}
              <ArrowUpRight size={12} strokeWidth={2.2} />
            </a>
          </motion.div>
        </div>

        {/* Accordion — constrained width */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.3 }}
          className="max-w-[680px]"
        >
          <div className="h-px bg-[#2A2118]/10" />

          {/* defaultValue="q1" — first item open on mount */}
          <Accordion type="single" collapsible defaultValue="q1">
            {FAQ.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.45 }}
        className="px-10 pb-8 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <LabelCaps theme="welcome">Contact</LabelCaps>
          <span className="w-6 h-px bg-corn-700/35" />
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-sans text-[0.8125rem] text-[#2A2118] hover:text-corn-700 underline underline-offset-2 decoration-[#2A2118]/25 hover:decoration-corn-700 transition-colors"
          >
            {CONTACT_EMAIL}
          </a>
        </div>
        <span className="font-sans text-[10px] text-corn-700">© 2026</span>
      </motion.footer>
    </div>
  )
}
