import { useState } from 'react'
import { CalendarDays, Users, Check } from 'lucide-react'
import { JoinedClubs } from '@/components/dashboard/JoinedClubs'
import { PeerActivity } from '@/components/dashboard/PeerActivity'
import { CompetitionCalendar } from '@/components/dashboard/CompetitionCalendar'

const WEBINAR_BASE_ATTENDING = 23

export function DashboardHome() {
  // No real RSVP backend yet — mirrors the mock-but-honest pattern used for
  // OAuth sign-in (auth-context.tsx): the click does something real and
  // persists for the session, it just isn't wired to a server. Better than a
  // button that silently does nothing on click.
  const [registered, setRegistered] = useState(false)
  return (
    <div className="flex-1 flex flex-col md:flex-row gap-8 md:gap-10 px-4 md:px-8 py-6 md:py-8">
      {/* Left column */}
      <div className="flex-1 min-w-0 md:max-w-[560px] flex flex-col gap-8">
        <JoinedClubs />

        <PeerActivity />
      </div>

      {/* Right column */}
      <div className="w-full md:w-[260px] lg:w-[320px] flex-shrink-0 flex flex-col md:justify-end gap-8">
        <CompetitionCalendar />

        <div className="bg-white/[0.03] border border-white/8 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-sans text-[10px] font-medium tracking-[0.18em] uppercase text-dark-muted">
              Next webinar
            </span>
            <CalendarDays size={12} strokeWidth={1.8} className="text-dark-muted" />
          </div>
          <div className="font-sans text-[0.875rem] font-semibold text-dark-text leading-snug mb-1">
            Aerospace Propulsion Systems
          </div>
          <div className="font-sans text-[11px] text-dark-muted mb-3">
            Aerospace · Fri, Jul 18 · 5:00 PM EST
          </div>
          <div className="h-px bg-white/8 mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-dark-muted">
              <Users size={11} strokeWidth={1.8} />
              <span className="font-sans text-[11px]">
                {WEBINAR_BASE_ATTENDING + (registered ? 1 : 0)} attending
              </span>
            </div>
            {registered ? (
              <span className="flex items-center gap-1 font-sans text-[11px] font-semibold text-emerald-400 tracking-wide">
                <Check size={12} strokeWidth={2.5} />
                Registered
              </span>
            ) : (
              <button
                onClick={() => setRegistered(true)}
                className="font-sans text-[11px] font-semibold text-dark-text hover:text-white transition-colors tracking-wide"
              >
                Register →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
