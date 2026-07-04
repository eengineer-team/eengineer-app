import * as React from 'react'
import { Users } from 'lucide-react'
import { SEED_WEBINARS, type Webinar } from '@/lib/community-data'
import { Button } from '@/components/ui/button'

function WebinarCard({ webinar, onToggle }: { webinar: Webinar; onToggle: (id: string) => void }) {
  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-lg p-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="font-sans text-[0.9375rem] font-semibold text-white/90 leading-snug mb-1">
          {webinar.title}
        </div>
        <div className="font-sans text-[0.8125rem] text-white/50 mb-1.5">{webinar.speaker}</div>
        <div className="font-sans text-[11px] text-white/45">{webinar.date}</div>
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-white/45">
          <Users size={11} strokeWidth={1.8} />
          <span className="font-sans text-[11px]">{webinar.attending} attending</span>
        </div>
        <Button
          variant={webinar.registered ? 'shell' : 'accent'}
          size="sm"
          onClick={() => onToggle(webinar.id)}
        >
          {webinar.registered ? 'Registered' : 'Register'}
        </Button>
      </div>
    </div>
  )
}

export function Webinars() {
  const [webinars, setWebinars] = React.useState<Webinar[]>(SEED_WEBINARS)

  function toggleRegistration(id: string) {
    setWebinars((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, registered: !w.registered, attending: w.attending + (w.registered ? -1 : 1) }
          : w
      )
    )
  }

  const byDiscipline = new Map<string, Webinar[]>()
  for (const w of webinars) {
    if (!byDiscipline.has(w.discipline)) byDiscipline.set(w.discipline, [])
    byDiscipline.get(w.discipline)!.push(w)
  }

  return (
    <div className="flex flex-col gap-8">
      {Array.from(byDiscipline.entries()).map(([discipline, items]) => (
        <div key={discipline}>
          <span className="font-sans text-[11px] font-medium tracking-[0.16em] uppercase text-white/45 block mb-3">
            {discipline} webinars
          </span>
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
