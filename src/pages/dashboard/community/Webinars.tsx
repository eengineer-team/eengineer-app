import * as React from 'react'
import { Users } from 'lucide-react'
import { formatWebinarDate, type Discipline, type Webinar } from '@/lib/community-data'
import { Button } from '@/components/ui/button'
import { LabelCaps } from '@/components/ui/label-caps'
import { DrawCheck } from '@/components/dashboard/DrawCheck'
import { useWebinars } from '@/lib/webinars-context'
import { cn } from '@/lib/utils'

function WebinarCard({ webinar, onToggle }: { webinar: Webinar; onToggle: (id: string) => void }) {
  // Only true for the moment right after *this* click registers — never on
  // mount or on a later re-render, so the tick/draw-in plays once, as a
  // reaction to the action, not as page-load decoration.
  const [justRegistered, setJustRegistered] = React.useState(false)

  function handleClick() {
    if (!webinar.registered) {
      setJustRegistered(true)
      window.setTimeout(() => setJustRegistered(false), 220)
    }
    onToggle(webinar.id)
  }

  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-lg p-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="font-sans text-[0.9375rem] font-semibold text-dark-text leading-snug mb-1">
          {webinar.title}
        </div>
        <div className="font-sans text-[0.8125rem] text-dark-muted mb-1.5">{webinar.speaker}</div>
        <div className="font-sans text-[13px] text-dark-muted">{formatWebinarDate(webinar.startsAt)}</div>
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-dark-muted">
          <Users size={11} strokeWidth={1.8} />
          <span
            className={cn(
              'font-sans text-[13px] inline-block',
              justRegistered && 'animate-pop-in motion-reduce:animate-none'
            )}
          >
            {webinar.attending} attending
          </span>
        </div>
        <Button
          variant={webinar.registered ? 'done' : 'accent'}
          size="sm"
          onClick={handleClick}
        >
          {webinar.registered && <DrawCheck animate={justRegistered} />}
          {webinar.registered ? 'Registered' : 'Register'}
        </Button>
      </div>
    </div>
  )
}

// `discipline` scopes the list to one group's webinars (Community hub → group
// space). Omit to see everything grouped by discipline.
export function Webinars({ discipline }: { discipline?: Discipline } = {}) {
  const { webinars, toggleRegistration } = useWebinars()

  if (discipline) {
    const items = webinars.filter((w) => w.discipline === discipline)
    return items.length === 0 ? (
      <p className="font-sans text-[0.8125rem] text-dark-muted">No webinars scheduled yet in {discipline}.</p>
    ) : (
      <div className="flex flex-col gap-3">
        {items.map((w) => (
          <WebinarCard key={w.id} webinar={w} onToggle={toggleRegistration} />
        ))}
      </div>
    )
  }

  const byDiscipline = new Map<string, Webinar[]>()
  for (const w of webinars) {
    if (!byDiscipline.has(w.discipline)) byDiscipline.set(w.discipline, [])
    byDiscipline.get(w.discipline)!.push(w)
  }

  return (
    <div className="flex flex-col gap-8">
      {Array.from(byDiscipline.entries()).map(([disc, items]) => (
        <div key={disc}>
          <LabelCaps className="block mb-3">{disc} webinars</LabelCaps>
          <div className="flex flex-col gap-3">
            {items.map((w) => (
              <WebinarCard key={w.id} webinar={w} onToggle={toggleRegistration} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
