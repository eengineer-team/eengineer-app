import * as React from 'react'
import { CalendarDays, Users } from 'lucide-react'
import { JoinedClubs } from '@/components/dashboard/JoinedClubs'
import { PeerActivity } from '@/components/dashboard/PeerActivity'
import { StartHere } from '@/components/dashboard/StartHere'
import { CompetitionCalendar } from '@/components/dashboard/CompetitionCalendar'
import { Button } from '@/components/ui/button'
import { LabelCaps } from '@/components/ui/label-caps'
import { DrawCheck } from '@/components/dashboard/DrawCheck'
import { formatWebinarDate } from '@/lib/community-data'
import { useWebinars } from '@/lib/webinars-context'
import { useProfiles } from '@/lib/profiles-context'
import { ME_ID } from '@/lib/profile-data'
import { cn } from '@/lib/utils'

export function DashboardHome() {
  // Reads the same webinar store as the full Webinars page (webinars-context)
  // so registering here or there stays in sync instead of tracking two
  // independent RSVP states.
  const { webinars, toggleRegistration } = useWebinars()
  const nextWebinar = webinars[0]
  // Same click-scoped confirmation as Webinars.tsx's WebinarCard — only
  // plays for the moment right after this click registers, never on mount.
  const [justRegistered, setJustRegistered] = React.useState(false)

  function handleRegister() {
    if (!nextWebinar.registered) {
      setJustRegistered(true)
      window.setTimeout(() => setJustRegistered(false), 220)
    }
    toggleRegistration(nextWebinar.id)
  }

  const { getProfile } = useProfiles()
  const me = getProfile(ME_ID)
  const isEmpty = !!me && me.skills.length === 0 && me.projects.length === 0 && me.experience.length === 0

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-8 md:gap-10 px-4 md:px-8 py-6 md:py-8">
      {/* Left column */}
      <div className="flex-1 min-w-0 md:max-w-[560px] flex flex-col gap-8">
        {isEmpty && <StartHere />}

        <JoinedClubs />

        <PeerActivity />
      </div>

      {/* Right column */}
      <div className="w-full md:w-[260px] lg:w-[320px] flex-shrink-0 flex flex-col md:justify-end gap-8">
        <CompetitionCalendar />

        <div className="bg-white/[0.03] border border-white/8 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <LabelCaps>Next webinar</LabelCaps>
            <CalendarDays size={12} strokeWidth={1.8} className="text-dark-muted" />
          </div>
          <div className="font-sans text-[0.875rem] font-semibold text-dark-text leading-snug mb-1">
            {nextWebinar.title}
          </div>
          <div className="font-sans text-[11px] text-dark-muted mb-3">
            {nextWebinar.discipline} · {formatWebinarDate(nextWebinar.startsAt)}
          </div>
          <div className="h-px bg-white/8 mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-dark-muted">
              <Users size={11} strokeWidth={1.8} />
              <span
                className={cn(
                  'font-sans text-[11px] inline-block',
                  justRegistered && 'animate-pop-in motion-reduce:animate-none'
                )}
              >
                {nextWebinar.attending} attending
              </span>
            </div>
            <Button
              variant={nextWebinar.registered ? 'done' : 'accent'}
              size="sm"
              onClick={handleRegister}
            >
              {nextWebinar.registered && <DrawCheck animate={justRegistered} />}
              {nextWebinar.registered ? 'Registered' : 'Register'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
