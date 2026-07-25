import * as React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import * as contestsApi from '@/lib/api/contests'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/ui/wordmark'
import { LabelCaps } from '@/components/ui/label-caps'
import { errorMessage } from '@/lib/utils'

// Public, ungated contest page.
//
// Deliberately OUTSIDE /dashboard: the dashboard is behind auth, and putting
// the contest there meant a first-time visitor had to create an account
// before they could even find out what the contest was. Founder call --
// "directly leads to the contest and registration is way better than having
// to have a gate". So the page reads for anyone (contests_select_public
// already grants SELECT to the anon role) and only asks for an account at
// the point of actually entering, which is when an account is genuinely
// required -- an entry has to belong to somebody.
//
// Styled off the landing page (cornsilk / #2A2118 ink), not the dark
// dashboard, since that's where visitors arrive from.

type PublicContest = Awaited<ReturnType<typeof contestsApi.fetchPublicContests>>[number]

function deadlineLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function daysLeft(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
}

/** "ages 14–16" out of "eengineer Challenge 2026 — ages 14–16", so the track
 *  cards read as brackets rather than repeating the full title three times. */
function trackLabel(title: string): string {
  const parts = title.split('—')
  return (parts.length > 1 ? parts[parts.length - 1] : title).trim()
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
}

export function Contest() {
  const [contests, setContests] = React.useState<PublicContest[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    contestsApi
      .fetchPublicContests()
      .then(setContests)
      .catch((err) => setError(errorMessage(err, "Couldn't load the contest right now.")))
  }, [])

  const open = (contests ?? []).filter((c) => c.phase === 'submitting')
  const headline = open[0] ?? contests?.[0] ?? null

  return (
    <div className="min-h-screen bg-corn-100 flex flex-col">
      <header className="flex items-center justify-between px-5 sm:px-10 pt-6 sm:pt-8">
        <Link to="/" className="flex items-center group">
          <Wordmark variant="light" className="transition-opacity group-hover:opacity-70" />
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 font-sans text-[0.8125rem] text-corn-800 hover:text-corn-700 transition-colors"
        >
          <ArrowLeft size={13} strokeWidth={2} />
          Back to eengineer
        </Link>
      </header>

      <main className="flex-1 px-5 sm:px-10 py-12 lg:py-16">
        <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-[760px]">
          <motion.div variants={fadeUp} transition={{ duration: 0.4 }}>
            <LabelCaps theme="welcome" className="block mb-3">
              Open now
            </LabelCaps>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="font-display font-extrabold text-[#2A2118] text-[clamp(2rem,5vw,3.25rem)] leading-[1.05] tracking-[-0.02em] mb-5"
          >
            eengineer Challenge 2026
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.4 }}
            className="font-sans text-[1rem] leading-[1.65] text-[#2A2118] max-w-[560px] mb-4"
          >
            Explain an engineering or science idea you find genuinely interesting — and show it
            working. Build it, film it, simulate it, draw it, write it. The format is yours.
          </motion.p>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.4 }}
            className="font-sans text-[0.9375rem] leading-[1.65] text-[#2A2118]/75 max-w-[560px] mb-8"
          >
            Entries are compared head-to-head by the community with no names attached, so what gets
            ranked is the work, not who posted it. Three age groups, judged separately. Top three in
            each are awarded.
          </motion.p>

          {headline && (
            <motion.div variants={fadeUp} transition={{ duration: 0.4 }} className="flex items-center gap-3.5 mb-10">
              <Button
                asChild
                variant="primary"
                size="lg"
                className="gap-2 font-sans text-[0.8125rem] font-semibold tracking-[0.05em] uppercase"
              >
                <Link to="/auth?mode=signup">
                  Enter the challenge
                  <ArrowRight size={13} strokeWidth={2.5} />
                </Link>
              </Button>
              <span className="font-sans text-[0.8125rem] text-corn-800">
                {daysLeft(headline.submissionDeadline) > 0
                  ? `${daysLeft(headline.submissionDeadline)} days left to enter`
                  : 'Submissions are closed'}
              </span>
            </motion.div>
          )}
        </motion.div>

        {error && <p className="font-sans text-[0.8125rem] text-red-700 max-w-[760px]">{error}</p>}

        {!error && !contests && (
          <p className="font-sans text-[0.8125rem] text-corn-800">Loading…</p>
        )}

        {contests && open.length > 0 && (
          <section className="max-w-[900px]">
            <LabelCaps theme="welcome" className="block mb-4">
              Age groups
            </LabelCaps>
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              {open.map((c) => (
                <motion.div
                  key={c.id}
                  variants={fadeUp}
                  transition={{ duration: 0.4 }}
                  className="rounded-lg border border-[#2A2118]/12 bg-white/45 p-5 flex flex-col"
                >
                  <h2 className="font-display font-extrabold text-[#2A2118] text-[1.125rem] tracking-[-0.01em] mb-1.5">
                    {trackLabel(c.title)}
                  </h2>
                  <p className="font-sans text-[0.8125rem] text-[#2A2118]/70 leading-snug mb-4">
                    Judged only against others in this bracket.
                  </p>
                  <div className="mt-auto font-sans text-[12px] text-corn-800">
                    Closes {deadlineLabel(c.submissionDeadline)}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}

        {contests && open.length === 0 && (
          <p className="font-sans text-[0.9375rem] text-[#2A2118]/75 max-w-[560px]">
            No challenge is open for entries right now. The next one is announced here first.
          </p>
        )}

        <section className="max-w-[760px] mt-14 pt-10 border-t border-[#2A2118]/10">
          <LabelCaps theme="welcome" className="block mb-4">
            How it works
          </LabelCaps>
          <ol className="flex flex-col gap-4">
            {[
              ['Enter', 'Create an account and submit one entry to your age group before the deadline.'],
              ['Blind review', 'After the deadline, entries are shown to the community two at a time, without names.'],
              ['Ranking', 'Every head-to-head result moves a rating, so the ranking comes from many small comparisons rather than one panel.'],
              ['Results', 'Top three in each age group are awarded once voting closes.'],
            ].map(([title, body], i) => (
              <li key={title} className="flex gap-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-corn-700/15 border border-corn-700/25 flex items-center justify-center font-sans text-[12px] font-bold text-corn-700">
                  {i + 1}
                </span>
                <div>
                  <div className="font-sans text-[0.9375rem] font-semibold text-[#2A2118] mb-0.5">{title}</div>
                  <p className="font-sans text-[0.8125rem] text-[#2A2118]/75 leading-relaxed max-w-[520px]">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="px-5 sm:px-10 pb-8 pt-4">
        <span className="font-sans text-[12px] text-corn-700">© 2026 eengineer</span>
      </footer>
    </div>
  )
}
