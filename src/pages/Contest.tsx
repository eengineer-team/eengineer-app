import * as React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import * as contestsApi from '@/lib/api/contests'
import type { ContestAgeGroup } from '@/lib/api/contests'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Wordmark } from '@/components/ui/wordmark'
import { LabelCaps } from '@/components/ui/label-caps'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { errorMessage, cn } from '@/lib/utils'
import { AVAILABLE_LANGS, DEFAULT_LANG, LANG_LABEL, getContestCopy, type Lang } from '@/lib/i18n/contest'

// Public, ungated contest page. Rebuilt 2026-07-26 per the founder's video
// contest doc: About / Judging / Register / FAQ / Sponsors, in that order,
// sticky nav, and registration that needs NO eengineer account -- see
// supabase/migrations/20260726160000_contest_registrations.sql. The
// account floor (13, Onboarding.tsx MINIMUM_AGE) and the contest floor (12)
// are independent; this page never touches the former.
//
// No contest row currently exists (no confirmed submission deadline), so
// there is deliberately no countdown anywhere on this page -- a ticking
// clock next to an unconfirmed date is a stronger, false claim, and a
// participant's wasted video is worse than a missing feature. If a real
// `contests` row with a phase of "submitting" shows up later, the deadline
// note below picks it up automatically; until then registration just reads
// as open now, which is the truthful, useful state.

const NAV_SECTIONS = ['about', 'judging', 'register', 'faq', 'sponsors'] as const

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <LabelCaps theme="welcome" className="block mb-4">
      {children}
    </LabelCaps>
  )
}

export function Contest() {
  const [lang, setLang] = React.useState<Lang>(DEFAULT_LANG)
  const t = getContestCopy(lang)

  const [openContests, setOpenContests] = React.useState<
    Awaited<ReturnType<typeof contestsApi.fetchPublicContests>> | null
  >(null)

  React.useEffect(() => {
    contestsApi
      .fetchPublicContests()
      .then((cs) => setOpenContests(cs.filter((c) => c.phase === 'submitting')))
      .catch(() => setOpenContests([]))
  }, [])

  const headline = openContests && openContests.length > 0 ? openContests[0] : null

  return (
    <div className="min-h-screen bg-corn-100 flex flex-col">
      <header className="flex items-center justify-between px-5 sm:px-10 pt-6 sm:pt-8 gap-4">
        <Link to="/" className="flex items-center group flex-shrink-0">
          <Wordmark variant="light" className="transition-opacity group-hover:opacity-70" />
        </Link>

        <nav className="hidden sm:flex items-center gap-5">
          {NAV_SECTIONS.map((s) => (
            <a
              key={s}
              href={`#${s}`}
              className="font-sans text-[0.8125rem] text-corn-800 hover:text-corn-900 transition-colors"
            >
              {t.nav[s]}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3 flex-shrink-0">
          {AVAILABLE_LANGS.length > 1 && (
            <div className="flex items-center gap-1">
              {AVAILABLE_LANGS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={cn(
                    'font-sans text-[0.75rem] px-1.5 py-1 rounded transition-colors',
                    l === lang ? 'text-corn-900 font-semibold' : 'text-corn-800/60 hover:text-corn-800'
                  )}
                >
                  {LANG_LABEL[l]}
                </button>
              ))}
            </div>
          )}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 font-sans text-[0.8125rem] text-corn-800 hover:text-corn-700 transition-colors"
          >
            <ArrowLeft size={13} strokeWidth={2} />
            eengineer
          </Link>
        </div>
      </header>

      <main className="flex-1 px-5 sm:px-10 py-12 lg:py-16 flex flex-col gap-20">
        <motion.section
          id="about"
          variants={stagger}
          initial="hidden"
          animate="show"
          className="max-w-[760px] scroll-mt-24"
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.4 }}>
            <LabelCaps theme="welcome" className="block mb-3">
              {t.hero.eyebrow}
            </LabelCaps>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="font-display font-extrabold text-[#2A2118] text-[clamp(2rem,5vw,3.25rem)] leading-[1.05] tracking-[-0.02em] mb-5"
          >
            eengineer Challenge
          </motion.h1>

          {t.aboutBody.map((p, i) => (
            <motion.p
              key={i}
              variants={fadeUp}
              transition={{ duration: 0.4 }}
              className={cn(
                'font-sans leading-[1.65] text-[#2A2118] max-w-[560px]',
                i === 0 ? 'text-[1rem] mb-4' : 'text-[0.9375rem] text-[#2A2118]/75 mb-4'
              )}
            >
              {p}
            </motion.p>
          ))}

          <motion.p variants={fadeUp} transition={{ duration: 0.4 }} className="font-sans text-[0.875rem] text-corn-800 max-w-[560px]">
            {headline
              ? `Closes ${new Date(headline.submissionDeadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`
              : t.registrationOpenNote}
          </motion.p>
        </motion.section>

        <section id="judging" className="max-w-[760px] scroll-mt-24">
          <SectionLabel>{t.judgingTitle}</SectionLabel>
          <p className="font-sans text-[0.9375rem] leading-[1.7] text-[#2A2118]/85 mb-6">{t.judgingIntro}</p>

          <div className="flex flex-col gap-3 mb-6">
            {t.judgingCriteria.map((c) => (
              <div key={c.label} className="rounded-lg border border-[#2A2118]/12 bg-white/45 p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-sans text-[0.875rem] font-semibold text-[#2A2118]">{c.label}</span>
                  <span className="font-sans text-[0.8125rem] font-bold text-corn-700">{c.weight}</span>
                </div>
                <p className="font-sans text-[0.8125rem] text-[#2A2118]/70 leading-snug">{c.description}</p>
              </div>
            ))}
          </div>

          <ul className="flex flex-col gap-1.5 mb-4">
            {t.judgingGates.map((g) => (
              <li key={g} className="font-sans text-[0.8125rem] text-[#2A2118]/80 flex items-start gap-2">
                <Check size={14} strokeWidth={2.5} className="text-corn-700 flex-shrink-0 mt-[3px]" />
                {g}
              </li>
            ))}
          </ul>

          <p className="font-sans text-[0.8125rem] text-[#2A2118]/60 leading-relaxed">{t.judgingShortlist}</p>
        </section>

        <RegisterSection t={t} />

        <section id="faq" className="max-w-[760px] scroll-mt-24">
          <SectionLabel>{t.faqTitle}</SectionLabel>
          <Accordion type="single" collapsible className="rounded-lg border border-[#2A2118]/12 bg-white/45 px-5">
            {t.faq.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-8">
            <InquirySection t={t} />
          </div>
        </section>

        <section id="sponsors" className="max-w-[760px] scroll-mt-24">
          <SectionLabel>{t.sponsorsTitle}</SectionLabel>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-[132px] h-[72px] rounded-lg border border-corn-900/12 bg-white/40">
              <img src="/edugrants-mark-black-transparent.png" alt="Edugrants" className="max-h-[36px] max-w-[88px] object-contain" />
            </div>
            <div className="flex items-center justify-center w-[132px] h-[72px] rounded-lg border border-corn-900/12 bg-white/40">
              <img src="/pizik-mark-transparent.png" alt="Pizik Lab" className="max-h-[36px] max-w-[88px] object-contain" />
            </div>
          </div>
        </section>
      </main>

      <footer className="px-5 sm:px-10 pb-8 pt-4">
        <span className="font-sans text-[12px] text-corn-700">© 2026 eengineer</span>
      </footer>
    </div>
  )
}

function RegisterSection({ t }: { t: ReturnType<typeof getContestCopy> }) {
  const [name, setName] = React.useState('')
  const [region, setRegion] = React.useState('')
  const [ageGroup, setAgeGroup] = React.useState<ContestAgeGroup>('senior')
  const [telegram, setTelegram] = React.useState('')
  const [guardianTelegram, setGuardianTelegram] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [success, setSuccess] = React.useState(false)
  const [justSucceeded, setJustSucceeded] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const normalizedTelegram = contestsApi.normalizeTelegramHandle(telegram)
  const normalizedGuardian = contestsApi.normalizeTelegramHandle(guardianTelegram)
  const showGuardianWarning =
    ageGroup === 'junior' && normalizedGuardian.length > 0 && normalizedGuardian === normalizedTelegram

  const canSubmit =
    name.trim().length > 0 &&
    region.trim().length > 0 &&
    telegram.trim().length > 0 &&
    (ageGroup === 'senior' || guardianTelegram.trim().length > 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await contestsApi.registerForContest({
        name,
        region,
        ageGroup,
        contactTelegram: telegram,
        guardianTelegram: ageGroup === 'junior' ? guardianTelegram : undefined,
        contactEmail: email || undefined,
      })
      setSuccess(true)
      setJustSucceeded(true)
      window.setTimeout(() => setJustSucceeded(false), 220)
    } catch (err) {
      setError(errorMessage(err, t.form.errorFallback))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="register" className="max-w-[560px] scroll-mt-24">
      <SectionLabel>{t.nav.register}</SectionLabel>

      {success ? (
        <div
          className={cn(
            'rounded-lg border border-corn-700/30 bg-corn-700/10 p-6',
            justSucceeded && 'animate-pop-in motion-reduce:animate-none'
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <Check size={16} strokeWidth={2.5} className="text-corn-700" />
            <span className="font-sans text-[0.9375rem] font-semibold text-[#2A2118]">{t.form.successTitle}</span>
          </div>
          <p className="font-sans text-[0.8125rem] text-[#2A2118]/75 leading-relaxed">{t.form.successBody}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="font-sans text-[0.8125rem] text-[#2A2118]/70 leading-relaxed">{t.registrationOpenNote}</p>

          <div>
            <label className="block font-sans text-[0.75rem] font-semibold text-[#2A2118]/70 mb-1.5">
              {t.form.name}
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.form.namePlaceholder} />
          </div>

          <div>
            <label className="block font-sans text-[0.75rem] font-semibold text-[#2A2118]/70 mb-1.5">
              {t.form.region}
            </label>
            <Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder={t.form.regionPlaceholder} />
          </div>

          <div>
            <label className="block font-sans text-[0.75rem] font-semibold text-[#2A2118]/70 mb-1.5">
              {t.form.ageGroup}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['junior', 'senior'] as ContestAgeGroup[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setAgeGroup(g)}
                  className={cn(
                    'rounded-lg border px-4 py-3.5 font-sans text-[0.875rem] font-semibold transition-colors text-left',
                    ageGroup === g
                      ? 'border-corn-700 bg-corn-700/10 text-corn-900'
                      : 'border-corn-900/15 bg-white/40 text-[#2A2118]/70 hover:border-corn-900/30'
                  )}
                >
                  {g === 'junior' ? t.form.junior : t.form.seniorLabel}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-sans text-[0.75rem] font-semibold text-[#2A2118]/70 mb-1.5">
              {t.form.telegram}
            </label>
            <Input value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder={t.form.telegramPlaceholder} />
          </div>

          {ageGroup === 'junior' && (
            <div className="animate-bubble-in motion-reduce:animate-none">
              <label className="block font-sans text-[0.75rem] font-semibold text-[#2A2118]/70 mb-1.5">
                {t.form.guardianTelegram}
              </label>
              <Input
                value={guardianTelegram}
                onChange={(e) => setGuardianTelegram(e.target.value)}
                placeholder={t.form.telegramPlaceholder}
              />
              <p className="font-sans text-[0.75rem] text-[#2A2118]/60 leading-snug mt-1.5">{t.form.guardianTelegramHelp}</p>
              {showGuardianWarning && (
                <p className="font-sans text-[0.75rem] text-corn-700 leading-snug mt-1">{t.form.guardianTelegramWarning}</p>
              )}
            </div>
          )}

          <div>
            <label className="block font-sans text-[0.75rem] font-semibold text-[#2A2118]/70 mb-1.5">
              {t.form.email}
            </label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.form.emailPlaceholder} />
          </div>

          {error && <p className="font-sans text-[0.8125rem] text-red-700">{error}</p>}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={!canSubmit || submitting}
            className="font-sans text-[0.8125rem] font-semibold tracking-[0.05em] uppercase self-start"
          >
            {submitting ? t.form.submitting : t.form.submit}
          </Button>
        </form>
      )}
    </section>
  )
}

function InquirySection({ t }: { t: ReturnType<typeof getContestCopy> }) {
  const [contact, setContact] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [sent, setSent] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!contact.trim() || !message.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await contestsApi.submitContestInquiry({ contact, message })
      setSent(true)
      setContact('')
      setMessage('')
    } catch (err) {
      setError(errorMessage(err, "Couldn't send that right now."))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg border border-[#2A2118]/12 bg-white/45 p-5">
      <p className="font-sans text-[0.875rem] font-semibold text-[#2A2118] mb-3">{t.inquiry.title}</p>
      {sent ? (
        <p className="font-sans text-[0.8125rem] text-corn-700">{t.inquiry.success}</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder={t.inquiry.contactPlaceholder} />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder={t.inquiry.messagePlaceholder}
            className="w-full bg-white/50 border border-corn-900/15 rounded px-3.5 py-2.5 font-sans text-sm text-[#2A2118] placeholder:text-corn-700/45 focus:outline-none focus:border-corn-700 resize-none"
          />
          {error && <p className="font-sans text-[0.8125rem] text-red-700">{error}</p>}
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            disabled={!contact.trim() || !message.trim() || submitting}
            className="self-start font-sans text-[0.75rem] font-semibold uppercase tracking-[0.05em]"
          >
            {t.inquiry.submit}
          </Button>
        </form>
      )}
    </div>
  )
}
