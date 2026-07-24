import * as React from 'react'
import { CalendarDays, Users } from 'lucide-react'
import { JoinedClubs } from '@/components/dashboard/JoinedClubs'
import { PeerActivity } from '@/components/dashboard/PeerActivity'
import { StartHere } from '@/components/dashboard/StartHere'
import { CompetitionCalendar } from '@/components/dashboard/CompetitionCalendar'
import { Button } from '@/components/ui/button'
import { LabelCaps } from '@/components/ui/label-caps'
import { DrawCheck } from '@/components/dashboard/DrawCheck'
import { formatWebinarDate, isWebinarLive, type Webinar } from '@/lib/community-data'
import { useWebinars } from '@/lib/webinars-context'
import { useProfiles } from '@/lib/profiles-context'
import { ME_ID } from '@/lib/profile-data'
import { cn } from '@/lib/utils'

export function DashboardHome() {
  // Reads the same webinar store as the full Webinars page (webinars-context)
  // so registering here or there stays in sync instead of tracking two
  // independent RSVP states.
  const { webinars, toggleRegistration } = useWebinars()
  // Webinars now load asynchronously from Supabase, so the first render always
  // has an empty list — this is undefined until the fetch resolves. Typed
  // explicitly because tsconfig has noUncheckedIndexedAccess off and would
  // otherwise claim webinars[0] is always a Webinar.
  const nextWebinar: Webinar | undefined = webinars[0]
  // Same click-scoped confirmation as Webinars.tsx's WebinarCard — only
  // plays for the moment right after this click registers, never on mount.
  const [justRegistered, setJustRegistered] = React.useState(false)

  function handleRegister() {
    if (!nextWebinar) return
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
    <div className="flex-1 w-full max-w-[1180px] mx-auto flex flex-col md:flex-row gap-8 md:gap-10 px-4 md:px-8 py-6 md:py-8">
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
            {/* "Next webinar" read as a scheduling utility, not something to
                be curious about -- relabeled as a news eyebrow per founder
                feedback ("intrigue"), same slot, no functional change. */}
            <LabelCaps className="text-gold-dark">Community news</LabelCaps>
            <CalendarDays size={12} strokeWidth={1.8} className="text-dark-muted" />
          </div>
          {nextWebinar ? (
            <>
              <div className="flex items-center gap-2 mb-1.5">
                {/* Headline treatment: bigger + tighter leading than the old
                    plain title row, reads like a story headline. */}
                <span className="font-display text-[1.0625rem] font-bold text-dark-text leading-[1.15] tracking-[-0.01em]">
                  {nextWebinar.title}
                </span>
                {isWebinarLive(nextWebinar) && (
                  <span className="flex items-center gap-1 flex-shrink-0 font-sans text-[11px] font-semibold uppercase tracking-wide text-red-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              {/* Teaser/hook -- the "why should I care" line a bare title +
                  date never gave. Falls back to a generic hook rather than
                  hiding the row entirely when a webinar has no description
                  set yet (most don't, since there's no create-webinar UI). */}
              <p className="font-sans text-[13px] text-white/70 leading-snug mb-2">
                {nextWebinar.description ?? "Details drop soon — RSVP to get the topic first."}
              </p>
              <div className="font-sans text-[12px] text-dark-muted mb-3">
                — {nextWebinar.speaker} · {nextWebinar.discipline} · {formatWebinarDate(nextWebinar.startsAt)}
              </div>
              <div className="h-px bg-white/8 mb-3" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-dark-muted">
                  <Users size={11} strokeWidth={1.8} />
                  <span
                    className={cn(
                      'font-sans text-[13px] inline-block',
                      justRegistered && 'animate-pop-in motion-reduce:animate-none'
                    )}
                  >
                    {nextWebinar.attending} attending
                  </span>
                </div>
                {nextWebinar.registered && isWebinarLive(nextWebinar) && nextWebinar.meetingUrl ? (
                  <Button variant="accent" size="sm" asChild>
                    <a href={nextWebinar.meetingUrl} target="_blank" rel="noopener noreferrer">
                      Join
                    </a>
                  </Button>
                ) : (
                  <Button
                    variant={nextWebinar.registered ? 'done' : 'accent'}
                    size="sm"
                    onClick={handleRegister}
                  >
                    {nextWebinar.registered && <DrawCheck animate={justRegistered} />}
                    {nextWebinar.registered ? 'Registered' : 'Register'}
                  </Button>
                )}
              </div>
            </>
          ) : (
            // Honest empty state rather than a skeleton: an empty webinars
            // table and a still-loading fetch look the same from here, and
            // claiming "loading" for a list that may genuinely be empty is
            // the kind of small lie the rest of the app avoids.
            <div className="font-sans text-[13px] text-dark-muted">
              No upcoming webinars scheduled.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
