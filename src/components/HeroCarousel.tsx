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

function formatRecTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// Teaser slide -- founder ask (Telegram, 2026-08-02): "add like an upcoming
// video contest, like just mention contest, blur the background, make pizik
// lab x eengineer a little more obvious / but like people should not know
// for sure." Deliberately vague: no dates, no submission details, nothing
// that would need a migration or an admin-panel field to keep current.
//
// Deliberately built as its own thing rather than a fourth flavor of
// listing card: viewfinder corner brackets + a live-ticking REC counter
// (starts at 00:00 each time this slide comes into view) play on "camera
// pointed at something", a diagonal PREVIEW stamp reinforces "not the real
// thing yet", and a scanline texture over the dark surface gives it a
// filmstrip feel none of the other slides have. The Pizik Lab mark +
// eengineer wordmark lockup (same leaning composition as TrustMark in
// LandingFeatures.tsx) is still the one sharp, legible thing in the frame --
// everything around it stays soft/unconfirmed on purpose.
function TeaserSlide() {
  const [seconds, setSeconds] = React.useState(0)
  React.useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Decorative backdrop: blurred logo glow standing in for "footage we're
          not showing you", a spotlight vignette, and a subtle scanline texture. */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <img
          src="/pizik-mark-transparent.png"
          alt=""
          className="absolute -top-10 -right-10 w-40 h-40 object-contain blur-3xl opacity-30 rotate-12 invert"
        />
        <img
          src="/pizik-mark-transparent.png"
          alt=""
          className="absolute -bottom-14 -left-10 w-32 h-32 object-contain blur-3xl opacity-20 -rotate-6 invert"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.05] bg-[repeating-linear-gradient(180deg,#fff_0px,#fff_1px,transparent_1px,transparent_3px)]" />
      </div>

      {/* Viewfinder corner brackets -- the one visual motif that's specific
          to "camera pointed at something" rather than generic teaser chrome. */}
      <div className="absolute inset-3 pointer-events-none" aria-hidden="true">
        <span className="absolute top-0 left-0 w-3.5 h-3.5 border-t border-l border-white/25 rounded-tl-sm" />
        <span className="absolute top-0 right-0 w-3.5 h-3.5 border-t border-r border-white/25 rounded-tr-sm" />
        <span className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b border-l border-white/25 rounded-bl-sm" />
        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b border-r border-white/25 rounded-br-sm" />
      </div>

      {/* Diagonal "PREVIEW" stamp -- reinforces this isn't the real thing yet. */}
      <span
        aria-hidden="true"
        className="absolute top-5 -right-7 w-28 rotate-45 text-center font-sans text-[9px] font-bold tracking-[0.2em] text-white/25 border-y border-white/15 py-0.5"
      >
        PREVIEW
      </span>

      <div className="relative flex items-center gap-1.5 mb-4">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500/60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
        <span className="font-mono text-[11px] tracking-[0.15em] text-white/45 tabular-nums">
          REC {formatRecTime(seconds)}
        </span>
      </div>

      <div className="relative flex items-center gap-2.5 mb-4">
        <div className="w-11 h-11 rounded-xl bg-white border border-white/10 shadow-[0_6px_20px_rgba(0,0,0,0.35)] flex items-center justify-center rotate-[-8deg] -translate-x-1 p-2 flex-shrink-0">
          <img src="/pizik-mark-transparent.png" alt="Pizik Lab" className="w-full h-full object-contain" />
        </div>
        <span className="font-display text-lg text-white/25">×</span>
        <div className="rotate-[6deg] translate-x-1">
          <Wordmark variant="dark" size="sm" />
        </div>
      </div>

      <p className="relative font-display font-bold text-[1.25rem] leading-[1.2] text-white mb-2">
        Somebody&rsquo;s pointing a camera at something
      </p>
      <p className="relative font-sans text-[0.8125rem] text-white/55 leading-snug mb-auto">
        Pizik Lab × eengineer are plotting a video contest. That&rsquo;s all we&rsquo;ll say for now — no dates, no rules, no promises. Just don&rsquo;t be the last to know.
      </p>
      <Button asChild variant="ghost" size="sm" className="relative w-fit mt-4 gap-1.5 !border-white/15 !text-white hover:!bg-white/10">
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
            className={cn(
              'absolute inset-0 h-full rounded-lg shadow-[0_10px_28px_rgba(42,33,24,0.14)] p-6 flex flex-col',
              // Teaser gets its own dark, spotlit card instead of the shared
              // white one -- it's meant to feel like a different kind of
              // thing catching your eye mid-scroll, not another listing.
              slide.kind === 'teaser'
                ? 'bg-[#171310] border border-white/10'
                : 'bg-white border border-corn-900/10'
            )}
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
