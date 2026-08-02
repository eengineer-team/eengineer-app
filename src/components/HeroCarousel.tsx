import * as React from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Video, Users, Hammer, Trophy, ArrowRight } from 'lucide-react'
import { useCompetitions } from '@/lib/competitions-context'
import { fetchPublicWebinars } from '@/lib/api/community'
import { fetchPublicProjects, type PublicProject } from '@/lib/api/projects'
import type { Webinar } from '@/lib/community-data'
import { getDisciplineColor } from '@/lib/discipline-colors'
import { LabelCaps } from '@/components/ui/label-caps'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Hero carousel — founder ask (Telegram, 2026-08-01): fill the empty space
// next to the headline with a rotating panel that catches a first-time
// visitor's eye: upcoming webinars (with the speaker's face), what the site
// actually does, real projects students are building, and competition
// deadlines. 10s per slide per spec ("10 seconds for each post"), pauses on
// hover so it can actually be read.
//
// Every category is skip-if-empty except `features`, which is static copy
// and always present — so the carousel is never just one slide even before
// any webinars/projects exist to show (webinars table is empty at launch).

const SLIDE_MS = 10_000

type Slide =
  | { kind: 'webinar'; webinar: Webinar }
  | { kind: 'feature'; id: string; Icon: typeof Video; title: string; description: string }
  | { kind: 'project'; project: PublicProject }
  | {
      kind: 'deadline'
      id: string
      name: string
      discipline: string
      organizer: string
      location: string
      deadline: Date
    }

const FEATURES: { id: string; Icon: typeof Video; title: string; description: string }[] = [
  {
    id: 'community',
    Icon: Users,
    title: 'Nine engineering disciplines, one community',
    description: 'From model rockets to bridges — post what you\'re building and get feedback from real builders.',
  },
  {
    id: 'projects',
    Icon: Hammer,
    title: 'Document, share, and ship real projects',
    description: 'Every builder gets a project page — write it up, get feedback, iterate, and put it out into the world.',
  },
  {
    id: 'contests',
    Icon: Trophy,
    title: 'Blind peer-voted contests, Elo-ranked',
    description: 'Submit an entry, vote on others\' work, climb the leaderboard — judged by builders, not a black box.',
  },
]

function formatSlideDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatShortDate(d: Date) {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
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

function FeatureSlide({ Icon, title, description }: (typeof FEATURES)[number]) {
  return (
    <div className="flex flex-col h-full">
      <div className="w-11 h-11 rounded-xl bg-corn-900/8 text-corn-900 flex items-center justify-center mb-5">
        <Icon size={20} strokeWidth={1.8} />
      </div>
      <LabelCaps theme="welcome" className="block mb-2">
        Why eengineer
      </LabelCaps>
      <p className="font-display font-bold text-[1.375rem] leading-[1.15] text-[#2A2118] mb-2.5">{title}</p>
      <p className="font-sans text-[0.8125rem] text-corn-800/75 leading-relaxed mb-auto">{description}</p>
      <Button asChild variant="ghost" size="sm" className="w-fit mt-4 gap-1.5">
        <Link to="/auth?mode=signup">
          Explore
          <ArrowRight size={13} strokeWidth={2.5} />
        </Link>
      </Button>
    </div>
  )
}

function ProjectSlide({ project }: { project: PublicProject }) {
  const img = project.thumbnailUrl ?? project.coverUrl
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1.5 mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-corn-700" />
        <LabelCaps theme="welcome">Built by a student here</LabelCaps>
      </div>
      <div className="flex items-center gap-3 mb-4">
        {img ? (
          <img src={img} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-corn-900/10" />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-corn-900/8 flex items-center justify-center flex-shrink-0">
            <Hammer size={20} strokeWidth={1.8} className="text-corn-900/50" />
          </div>
        )}
        <p className="font-display font-bold text-[1.25rem] leading-[1.15] text-[#2A2118] line-clamp-2">{project.name}</p>
      </div>
      <p className="font-sans text-[0.8125rem] text-corn-800/75 leading-relaxed mb-auto line-clamp-4">
        {project.description || 'No write-up yet — see the project page for what they\'re building.'}
      </p>
      <Button asChild variant="ghost" size="sm" className="w-fit mt-4 gap-1.5">
        <Link to="/auth?mode=signup">
          See projects
          <ArrowRight size={13} strokeWidth={2.5} />
        </Link>
      </Button>
    </div>
  )
}

function DeadlineSlide({ slide }: { slide: Extract<Slide, { kind: 'deadline' }> }) {
  const disc = getDisciplineColor(slide.discipline)
  const daysUntil = Math.round((slide.deadline.getTime() - Date.now()) / 86_400_000)
  const label = daysUntil <= 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1.5 mb-4">
        <span className={cn('w-1.5 h-1.5 rounded-full', disc.dot)} />
        <LabelCaps theme="welcome">Competition deadline</LabelCaps>
      </div>
      <p className="font-display font-bold text-[1.375rem] leading-[1.15] text-[#2A2118] mb-2">{slide.name}</p>
      <span className="w-fit font-sans text-[12px] font-medium text-corn-900 bg-corn-500/25 rounded px-1.5 py-0.5 mb-3">
        Due {formatShortDate(slide.deadline)} — {label}
      </span>
      <p className="font-sans text-[0.8125rem] text-corn-800/75 leading-snug mb-auto">
        {slide.location} · {slide.discipline} · {slide.organizer}
      </p>
      <Button asChild variant="ghost" size="sm" className="w-fit mt-4 gap-1.5">
        <Link to="/auth?mode=signup">
          Set a reminder
          <ArrowRight size={13} strokeWidth={2.5} />
        </Link>
      </Button>
    </div>
  )
}

export function HeroCarousel() {
  const { competitions } = useCompetitions()
  const [webinars, setWebinars] = React.useState<Webinar[]>([])
  const [projects, setProjects] = React.useState<PublicProject[]>([])
  const [index, setIndex] = React.useState(0)
  const [paused, setPaused] = React.useState(false)

  React.useEffect(() => {
    fetchPublicWebinars().then(setWebinars).catch(() => setWebinars([]))
    fetchPublicProjects().then(setProjects).catch(() => setProjects([]))
  }, [])

  const slides: Slide[] = React.useMemo(() => {
    const webinarSlides: Slide[] = webinars.slice(0, 2).map((webinar) => ({ kind: 'webinar', webinar }))
    const featureSlides: Slide[] = FEATURES.map((f) => ({ kind: 'feature', ...f }))
    const projectSlides: Slide[] = projects.slice(0, 3).map((project) => ({ kind: 'project', project }))
    const deadlineSlides: Slide[] = [...competitions]
      .filter((c) => c.deadline.getTime() > Date.now())
      .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
      .slice(0, 2)
      .map((c) => ({
        kind: 'deadline',
        id: c.id,
        name: c.name,
        discipline: c.discipline,
        organizer: c.organizer,
        location: c.location,
        deadline: c.deadline,
      }))
    return [...webinarSlides, ...featureSlides, ...projectSlides, ...deadlineSlides]
  }, [webinars, projects, competitions])

  // Reset to a valid index whenever the slide set changes shape (e.g. data
  // finishes loading after the initial render) so we never point past the
  // end of a shorter array.
  React.useEffect(() => {
    setIndex((i) => (i >= slides.length ? 0 : i))
  }, [slides.length])

  React.useEffect(() => {
    if (paused || slides.length <= 1) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS)
    return () => clearInterval(timer)
  }, [paused, slides.length, index])

  if (slides.length === 0) return null
  const slide = slides[index]

  function slideKey(s: Slide): string {
    switch (s.kind) {
      case 'webinar':
        return `webinar-${s.webinar.id}`
      case 'feature':
        return `feature-${s.id}`
      case 'project':
        return `project-${s.project.id}`
      case 'deadline':
        return `deadline-${s.id}`
    }
  }

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 bg-white/60 border border-corn-900/10 rounded-lg p-6 h-[300px] flex flex-col"
    >
      <div className="flex-1 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={slideKey(slide)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className="h-full"
          >
            {slide.kind === 'webinar' && <WebinarSlide webinar={slide.webinar} />}
            {slide.kind === 'feature' && <FeatureSlide id={slide.id} Icon={slide.Icon} title={slide.title} description={slide.description} />}
            {slide.kind === 'project' && <ProjectSlide project={slide.project} />}
            {slide.kind === 'deadline' && <DeadlineSlide slide={slide} />}
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
              onClick={() => setIndex(i)}
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
