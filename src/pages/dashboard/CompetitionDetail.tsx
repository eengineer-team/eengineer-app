import * as React from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Calendar as CalendarIcon, Building2, Check } from 'lucide-react'
import { getCompetition, type Competition } from '@/lib/calendar-data'
import { Chip } from '@/components/ui/chip'
import { LabelCaps } from '@/components/ui/label-caps'
import { Button, buttonVariants } from '@/components/ui/button'
import { getDisciplineColor } from '@/lib/discipline-colors'
import { DisciplineMotif } from '@/components/community/DisciplineMotif'
import { cn } from '@/lib/utils'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatDate(d: Date): string {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

// Data source is edugrants (founder integrating, see docs/ai-agent-build-
// instructions.md Шаг 10) — this page renders a Competition object and
// doesn't care whether it came from SEED_COMPETITIONS or a real API call,
// so swapping the data source later doesn't touch this component.
export function CompetitionDetail({ competition: competitionProp }: { competition?: Competition } = {}) {
  const { id } = useParams<{ id: string }>()
  const [registered, setRegistered] = React.useState(false)

  const competition = competitionProp ?? (id ? getCompetition(id) : undefined)

  if (!competition) return <Navigate to="/dashboard/calendar" replace />

  const color = getDisciplineColor(competition.discipline)

  return (
    <div className="flex-1 w-full px-8 py-8 max-w-[640px] mx-auto">
      <Link
        to="/dashboard/calendar"
        className="inline-flex items-center gap-1.5 font-sans text-[0.8125rem] text-dark-muted hover:text-white/85 transition-colors mb-6"
      >
        <ArrowLeft size={13} strokeWidth={2} />
        Calendar
      </Link>

      <div className={cn('relative overflow-hidden bg-dark-surface border border-white/10 border-t-2 rounded-lg p-6 mb-6', color.border)}>
        <DisciplineMotif
          size={130}
          className={cn('absolute -top-6 -right-6 opacity-[0.05]', color.text)}
        />
        <div className="relative flex items-start justify-between gap-4 mb-3">
          <div className="min-w-0">
            <h1 className="font-display text-[1.5rem] font-bold text-dark-text leading-tight">
              {competition.name}
            </h1>
            <p className="font-sans text-[0.8125rem] text-dark-muted mt-1 flex items-center gap-1.5">
              <Building2 size={13} strokeWidth={1.8} />
              {competition.organizer}
            </p>
          </div>
          <Chip theme="dashboard" discipline={competition.discipline} className="flex-shrink-0">
            {competition.discipline}
          </Chip>
        </div>

        <div className="flex items-center gap-4 mt-4 mb-5">
          <span className="flex items-center gap-1.5 font-sans text-[12px] text-white/60">
            <MapPin size={13} strokeWidth={1.8} />
            {competition.remote ? 'Remote' : competition.location}
          </span>
          <span className="flex items-center gap-1.5 font-sans text-[12px] text-gold-dark">
            <CalendarIcon size={13} strokeWidth={1.8} />
            Deadline {formatDate(competition.deadline)}
          </span>
        </div>

        {registered ? (
          <span className={cn(buttonVariants({ variant: 'done', size: 'md' }), 'pointer-events-none')}>
            <Check size={15} strokeWidth={2.2} />
            Registered
          </span>
        ) : (
          <Button variant="accent" size="md" onClick={() => setRegistered(true)}>
            Register / Apply
          </Button>
        )}
      </div>

      <section className="mb-6">
        <LabelCaps className="block mb-2">Overview</LabelCaps>
        <p className="font-sans text-[0.875rem] leading-[1.6] text-white/75">{competition.description}</p>
      </section>

      <section>
        <LabelCaps className="block mb-2">Requirements</LabelCaps>
        <ul className="flex flex-col gap-1.5">
          {competition.requirements.map((r, i) => (
            <li
              key={i}
              className="font-sans text-[0.8125rem] text-dark-muted leading-snug pl-3 relative before:content-['—'] before:absolute before:left-0 before:text-white/30"
            >
              {r}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
