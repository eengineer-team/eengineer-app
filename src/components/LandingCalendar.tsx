import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Bell } from 'lucide-react'
import { useCompetitions } from '@/lib/competitions-context'
import { getDisciplineColor } from '@/lib/discipline-colors'
import { LabelCaps } from '@/components/ui/label-caps'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function startOfDay(d: Date): Date {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function formatShortDate(d: Date): string {
  return `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}`
}

// Pre-auth mirror of dashboard/CompetitionCalendar.tsx — same behavior
// (current month, upcoming-only, deadline dots), cornsilk-themed instead of
// dark, and every link routes to signup rather than the real competition
// page since a visitor has no session yet.
//
// Reads live from CompetitionsProvider (mounted above the router, so it's
// available here too) rather than static seed data. This only works because
// competitions has an anon-readable SELECT policy (comp_select_public, see
// supabase/migrations/20260720130000_competitions_anon_read.sql) — opp_select
// has no such policy, which is why this reads competitions and not
// opportunities: migrating this component to opportunities would silently
// empty the homepage calendar for every logged-out visitor.
export function LandingCalendar() {
  const today = startOfDay(new Date())
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const [viewMonth, setViewMonth] = useState(currentMonthStart)
  const { competitions } = useCompetitions()

  const isViewingCurrentMonth = isSameDay(viewMonth, currentMonthStart)
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate()
  const firstWeekday = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay()

  const deadlinesByDay = new Map<number, { id: string; discipline: string }>()
  for (const comp of competitions) {
    if (comp.deadline.getFullYear() === viewMonth.getFullYear() && comp.deadline.getMonth() === viewMonth.getMonth()) {
      if (!deadlinesByDay.has(comp.deadline.getDate())) {
        deadlinesByDay.set(comp.deadline.getDate(), { id: comp.id, discipline: comp.discipline })
      }
    }
  }

  const cells: (number | null)[] = Array.from({ length: firstWeekday }, () => null)
  for (let day = 1; day <= daysInMonth; day++) {
    if (isViewingCurrentMonth && day < today.getDate()) {
      cells.push(null)
    } else {
      cells.push(day)
    }
  }

  const upcoming = [...competitions].sort((a, b) => a.deadline.getTime() - b.deadline.getTime())

  function goToPrevMonth() {
    const prev = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1)
    setViewMonth(prev < currentMonthStart ? currentMonthStart : prev)
  }

  function goToNextMonth() {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))
  }

  return (
    // Two columns on lg+ (07.2026): the old single 320px stack left a
    // viewport-wide cream void to its right. Calendar stays left (founder
    // spec); the void is filled with data that already exists in
    // SEED_COMPETITIONS but was shown nowhere pre-auth — description and
    // organizer — not with decoration.
    <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-4 lg:gap-6 items-start w-full max-w-[1040px]">
      <div className="flex flex-col gap-4">
      <div className="bg-white/60 border border-corn-900/10 rounded-lg p-4">
        <LabelCaps theme="welcome" className="block mb-3">
          Competition Calendar
        </LabelCaps>

        <div className="flex items-center justify-between mb-3">
          <span className="font-sans text-[0.875rem] font-semibold text-[#2A2118]">
            {MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrevMonth}
              disabled={isViewingCurrentMonth}
              className="p-1 rounded text-corn-700 hover:bg-corn-900/6 transition-colors disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Previous month"
            >
              <ChevronLeft size={14} strokeWidth={2} />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-1 rounded text-corn-700 hover:bg-corn-900/6 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight size={14} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-y-1.5 mb-1">
          {WEEKDAYS.map((wd) => (
            <span key={wd} className="font-sans text-[12px] text-corn-700 text-center">
              {wd}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1.5">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />
            const isToday = isViewingCurrentMonth && day === today.getDate()
            const deadline = deadlinesByDay.get(day)
            return (
              <Link
                key={i}
                to="/auth?mode=signup"
                className="flex flex-col items-center gap-0.5 hover:opacity-80 transition-opacity"
              >
                <span
                  className={
                    isToday
                      ? 'w-5 h-5 flex items-center justify-center rounded bg-corn-900 text-corn-100 font-sans text-[13px] font-semibold'
                      : 'w-5 h-5 flex items-center justify-center font-sans text-[13px] text-[#2A2118]/80'
                  }
                >
                  {day}
                </span>
                <span
                  className={cn('w-1 h-1 rounded-full', deadline && getDisciplineColor(deadline.discipline).dot)}
                />
              </Link>
            )
          })}
        </div>
      </div>

      <div className="bg-white/60 border border-corn-900/10 rounded-lg p-4">
        <LabelCaps theme="welcome" className="block mb-3">
          Daily Reminders
        </LabelCaps>
        <div className="flex flex-col gap-2.5">
          {upcoming.map((comp) => {
            const daysUntil = Math.round((comp.deadline.getTime() - today.getTime()) / 86400000)
            const label = daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`
            return (
              <div key={comp.id} className="flex items-start gap-2">
                <Bell size={12} strokeWidth={1.8} className="text-corn-700 mt-0.5 flex-shrink-0" />
                <span className="font-sans text-[13px] text-corn-800/85 leading-snug">
                  <span className="text-[#2A2118] font-medium">{comp.name}</span> deadline {label}.
                </span>
              </div>
            )
          })}
        </div>
      </div>
      </div>

      {/* Right column — full competition cards: name, deadline, description,
          organizer. All of it comes straight from the live competitions table. */}
      <div className="bg-white/60 border border-corn-900/10 rounded-lg p-4">
        <LabelCaps theme="welcome" className="block mb-3">
          Upcoming Deadlines
        </LabelCaps>
        <div className="flex flex-col gap-3">
          {upcoming.map((comp) => (
            <Link
              key={comp.id}
              to="/auth?mode=signup"
              className="flex flex-col gap-1.5 rounded-md border border-corn-900/8 p-3.5 hover:bg-corn-900/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', getDisciplineColor(comp.discipline).dot)} />
                <span className="flex-1 min-w-0 font-sans text-[0.875rem] font-semibold text-[#2A2118] leading-snug">
                  {comp.name}
                </span>
                <span className="font-sans text-[12px] font-medium text-corn-900 bg-corn-500/25 rounded px-1.5 py-0.5 whitespace-nowrap">
                  Deadline {formatShortDate(comp.deadline)}
                </span>
              </div>
              <p className="font-sans text-[0.8125rem] leading-[1.55] text-[#2A2118]/75">
                {comp.description}
              </p>
              <div className="font-sans text-[13px] text-corn-800">
                {comp.location} · {comp.discipline} · {comp.organizer}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
