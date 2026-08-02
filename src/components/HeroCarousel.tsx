import * as React from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { fetchPublicWebinars } from '@/lib/api/community'
import { fetchPublicOpportunities, opportunityDisciplineLabel, type Opportunity } from '@/lib/api/opportunities'
import type { Webinar } from '@/lib/community-data'
import { getDisciplineColor } from '@/lib/discipline-colors'
import { LabelCaps } from '@/components/ui/label-caps'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/ui/wordmark'
import { cn } from '@/lib/utils'

// Hero carousel — founder ask (Telegram, 2026-08-01/02): fill the empty
// space next to the headline with a rotating panel. First pass also had
// static "why eengineer" pitch slides and project/competition-deadline
// slides; founder feedback ("dont make it like promotion" / "just mention
// upcoming webinars, opportunities") cut it down to those two -- real,
// time-bound content instead of marketing copy. A third slide kind (see
// TeaserSlide below) was added after for a deliberately vague video-contest
// teaser, per a follow-up founder ask. 6s per slide, pauses on hover,
// scroll-to-navigate (see the wheel handler below).
//
// Webinar/opportunity slides are skip-if-empty. The teaser slide is static
// and always present, so the carousel never renders nothing.

const SLIDE_MS = 6_000

type Slide = { kind: 'webinar'; webinar: Webinar } | { kind: 'opportunity'; opportunity: Opportunity } | { kind: 'teaser' }

function formatSlideDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function SpeakerAvatar({ webinar }: { webinar: Webinar }) {
  if (webinar.speakerPhotoUrl) {
    return (
      <img
        src={webinar.speakerPhotoUrl}
        alt={webinar.speaker}
        className="w-14 h-14 rounded-full object-cover flex-shrink-0 border border-corn-900/10"
      />
    )
  }
  return (
    <div className="w-14 h-14 rounded-full bg-corn-900/10 text-corn-900 flex items-center justify-center flex-shrink-0 font-display font-bold text-lg">
      {webinar.speaker.charAt(0).toUpperCase() || '?'}
    </div>
  )
}

function WebinarSlide({ webinar }: { webinar: Webinar }) {
  const disc = getDisciplineColor(webinar.discipline)
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1.5 mb-4">
        <span className={cn('w-1.5 h-1.5 rounded-full', disc.dot)} />
        <LabelCaps theme="welcome">Upcoming webinar</LabelCaps>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <SpeakerAvatar webinar={webinar} />
        <div className="min-w-0">
          <p className="font-sans text-[0.875rem] font-semibold text-[#2A2118] truncate">{webinar.speaker}</p>
          {webinar.speakerBio && (
            <p className="font-sans text-[0.75rem] text-corn-800/70 leading-snug line-clamp-2">{webinar.speakerBio}</p>
          )}
        </div>
      </div>
      <p className="font-display font-bold text-[1.375rem] leading-[1.15] text-[#2A2118] mb-2">{webinar.title}</p>
      {webinar.description && (
        <p className="font-sans text-[0.8125rem] text-corn-800/75 leading-snug mb-3 line-clamp-2">{webinar.description}</p>
      )}
      <p className="font-sans text-[0.75rem] text-corn-700 mb-auto">{formatSlideDate(webinar.startsAt)}</p>
      <Button asChild variant="primary" size="sm" className="w-fit mt-4 gap-1.5">
        <Link to="/auth?mode=signup">
          Attend
          <ArrowRight size={13} strokeWidth={2.5} />
        </Link>
      </Button>
    </div>
  )
}

function OpportunitySlide({ opportunity }: { opportunity: Opportunity }) {
  const disc = getDisciplineColor(opportunityDisciplineLabel(opportunity.discipline))
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1.5 mb-4">
        <span className={cn('w-1.5 h-1.5 rounded-full', disc.dot)} />
        <LabelCaps theme="welcome">Opportunity</LabelCaps>
      </div>
      <p className="font-display font-bold text-[1.25rem] leading-[1.15] text-[#2A2118] mb-1.5 line-clamp-2">
        {opportunity.title}
      </p>
      <p className="font-sans text-[0.8125rem] text-corn-800 font-medium mb-3">{opportunity.org}</p>
      <span className="w-fit font-sans text-[12px] font-medium text-corn-900 bg-corn-500/25 rounded px-1.5 py-0.5 mb-3">
        {opportunity.deadlineLabel}
      </span>
      <p className="font-sans text-[0.8125rem] text-corn-800/75 leading-snug mb-auto line-clamp-3">
        {opportunity.description}
      </p>
      <Button asChild variant="ghost" size="sm" className="w-fit mt-4 gap-1.5">
        <Link to="/auth?mode=signup">
          View opportunity
          <ArrowRight size={13} strokeWidth={2.5} />
        </Link>
      </Button>
    </div>
  )
}

// Teaser slide -- founder ask (Telegram, 2026-08-02): "add like an upcoming
// video contest, like just mention contest, blur the background, make pizik
// lab x eengineer a little more obvious / but like people should not know
// for sure." Deliberately vague: no dates, no submission details, nothing
// that would need a migration or an admin-panel field to keep current --
// unlike the webinar/opportunity slides this is static copy, closer to the
// obscured "more coming" placeholder tile in SponsorMarquee than to real
// content. The Pizik Lab mark + eengineer wordmark lockup (same leaning
// composition as TrustMark in LandingFeatures.tsx) stays sharp so the
// partnership reads clearly; everything else -- the background glow, the
// copy -- stays soft/non-committal on purpose.
function TeaserSlide() {
  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <img
          src="/pizik-mark-transparent.png"
          alt=""
          className="absolute -top-8 -right-8 w-36 h-36 object-contain blur-2xl opacity-20 rotate-12"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white via-white/90 to-corn-500/10" />
      </div>

      <div className="relative flex items-center gap-1.5 mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-corn-700 animate-pulse" />
        <LabelCaps theme="welcome">Something&rsquo;s brewing</LabelCaps>
      </div>

      <div className="relative flex items-center gap-2.5 mb-4">
        <div className="w-11 h-11 rounded-xl bg-white border border-corn-900/10 shadow-[0_6px_16px_rgba(42,33,24,0.14)] flex items-center justify-center rotate-[-8deg] -translate-x-1 p-2 flex-shrink-0">
          <img src="/pizik-mark-transparent.png" alt="Pizik Lab" className="w-full h-full object-contain" />
        </div>
        <span className="font-display text-lg text-corn-900/25">×</span>
        <div className="rotate-[6deg] translate-x-1">
          <Wordmark variant="light" size="sm" />
        </div>
      </div>

      <p className="relative font-display font-bold text-[1.25rem] leading-[1.2] text-[#2A2118] mb-2">
        A video contest, maybe
      </p>
      <p className="relative font-sans text-[0.8125rem] text-corn-800/75 leading-snug mb-auto">
        Pizik Lab and eengineer are quietly cooking something up for builders who don&rsquo;t mind a camera. Nothing official yet — worth keeping an eye on.
      </p>
      <Button asChild variant="ghost" size="sm" className="relative w-fit mt-4 gap-1.5">
        <Link to="/auth?mode=signup">
          Get notified
          <ArrowRight size={13} strokeWidth={2.5} />
        </Link>
      </Button>
    </div>
  )
}

export function HeroCarousel() {
  const [webinars, setWebinars] = React.useState<Webinar[]>([])
  const [opportunities, setOpportunities] = React.useState<Opportunity[]>([])
  const [index, setIndex] = React.useState(0)
  const [direction, setDirection] = React.useState(1)
  const [paused, setPaused] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const wheelLockRef = React.useRef(false)

  React.useEffect(() => {
    fetchPublicWebinars().then(setWebinars).catch(() => setWebinars([]))
    fetchPublicOpportunities().then(setOpportunities).catch(() => setOpportunities([]))
  }, [])

  const slides: Slide[] = React.useMemo(() => {
    const webinarSlides: Slide[] = webinars.slice(0, 2).map((webinar) => ({ kind: 'webinar', webinar }))
    // Rolling programs (no deadlineDate) sort after dated ones but still
    // show -- "no deadline" isn't the same as "not worth mentioning".
    const opportunitySlides: Slide[] = [...opportunities]
      .filter((o) => !o.deadlineDate || o.deadlineDate.getTime() > Date.now())
      .sort((a, b) => {
        if (!a.deadlineDate) return 1
        if (!b.deadlineDate) return -1
        return a.deadlineDate.getTime() - b.deadlineDate.getTime()
      })
      .slice(0, 3)
      .map((opportunity) => ({ kind: 'opportunity', opportunity }))
    // Teaser is static and always included (not skip-if-empty like the two
    // data-driven kinds above) -- it's the one slide that doesn't depend on
    // anything loading, so it also keeps the carousel non-empty even before
    // webinars/opportunities have fetched.
    return [...webinarSlides, ...opportunitySlides, { kind: 'teaser' } as Slide]
  }, [webinars, opportunities])

  // Reset to a valid index whenever the slide set changes shape (e.g. data
  // finishes loading after the initial render) so we never point past the
  // end of a shorter array.
  React.useEffect(() => {
    setIndex((i) => (i >= slides.length ? 0 : i))
  }, [slides.length])

  React.useEffect(() => {
    if (paused || slides.length <= 1) return
    const timer = setInterval(() => {
      setDirection(1)
      setIndex((i) => (i + 1) % slides.length)
    }, SLIDE_MS)
    return () => clearInterval(timer)
  }, [paused, slides.length, index])

  // Wheel-driven navigation: scrolling over the card steps through slides
  // with a vertical effect instead of scrolling the page. Loops both ways
  // (last -> first, first -> last) — same infinite cycle the 6s auto-timer
  // already does — rather than releasing the scroll at the ends. Needs a
  // real (non-passive) DOM listener, not React's onWheel prop -- React
  // attaches wheel handlers passively by default, so e.preventDefault()
  // inside one is unreliable.
  React.useEffect(() => {
    const el = containerRef.current
    if (!el || slides.length <= 1) return

    function onWheel(e: WheelEvent) {
      if (Math.abs(e.deltaY) < 8) return // trackpad jitter
      e.preventDefault()
      if (wheelLockRef.current) return
      wheelLockRef.current = true
      const goingForward = e.deltaY > 0
      setDirection(goingForward ? 1 : -1)
      setIndex((i) => (goingForward ? (i + 1) % slides.length : (i - 1 + slides.length) % slides.length))
      // Debounce, not a "wait for the next deliberate scroll" gate — short
      // enough that holding the wheel/trackpad down keeps flipping through
      // cards at a fast, continuous clip, just still one slide per tick
      // instead of a single swipe skipping five at once.
      setTimeout(() => {
        wheelLockRef.current = false
      }, 220)
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [slides.length])

  if (slides.length === 0) return null
  const slide = slides[index]

  function slideKey(s: Slide): string {
    if (s.kind === 'webinar') return `webinar-${s.webinar.id}`
    if (s.kind === 'opportunity') return `opportunity-${s.opportunity.id}`
    return 'teaser'
  }

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 h-[300px] flex flex-col"
    >
      {/* The track just clips and positions — every visual "card" surface
          (background, border, shadow, rounded corners, padding) lives on
          the slide itself below, not here. That's what makes each slide
          read as its own separate card sliding past, instead of content
          reflowing inside one static frame. */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={slideKey(slide)}
            custom={direction}
            initial={{ y: direction > 0 ? '100%' : '-100%', opacity: 0, scale: 0.94 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: direction > 0 ? '-100%' : '100%', opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0 h-full bg-white border border-corn-900/10 rounded-lg shadow-[0_10px_28px_rgba(42,33,24,0.14)] p-6 flex flex-col"
          >
            {slide.kind === 'webinar' && <WebinarSlide webinar={slide.webinar} />}
            {slide.kind === 'opportunity' && <OpportunitySlide opportunity={slide.opportunity} />}
            {slide.kind === 'teaser' && <TeaserSlide />}
          </motion.div>
        </AnimatePresence>
      </div>

      {slides.length > 1 && (
        <div className="flex items-center gap-1.5 pt-4 flex-shrink-0" role="tablist" aria-label="Carousel slides">
          {slides.map((s, i) => (
            <button
              key={slideKey(s)}
              role="tab"
              aria-selected={i === index}
              aria-label={`Slide ${i + 1} of ${slides.length}`}
              onClick={() => {
                setDirection(i > index ? 1 : -1)
                setIndex(i)
              }}
              className={cn(
                'h-1 rounded-full transition-all duration-200',
                i === index ? 'w-5 bg-corn-900' : 'w-1.5 bg-corn-900/20 hover:bg-corn-900/35'
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
