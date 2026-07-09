import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Bell } from 'lucide-react'
import { SEED_COMPETITIONS } from '@/lib/calendar-data'
import { getDisciplineColor } from '@/lib/discipline-colors'
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
export function LandingCalendar() {
  const today = startOfDay(new Date())
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const [viewMonth, setViewMonth] = useState(currentMonthStart)

  const isViewingCurrentMonth = isSameDay(viewMonth, currentMonthStart)
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate()
  const firstWeekday = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay()

  const deadlinesByDay = new Map<number, { id: string; discipline: string }>()
  for (const comp of SEED_COMPETITIONS) {
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

  const upcoming = [...SEED_COMPETITIONS].sort((a, b) => a.deadline.getTime() - b.deadline.getTime())

  function goToPrevMonth() {
    const prev = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1)
    setViewMonth(prev < currentMonthStart ? currentMonthStart : prev)
  }

  function goToNextMonth() {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-[320px]">
      <div className="bg-white/60 border border-corn-900/10 rounded-lg p-4">
        <span className="font-sans text-[10px] font-medium tracking-[0.18em] uppercase text-corn-700 block mb-3">
          Competition Calendar
        </span>

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
            <span key={wd} className="font-sans text-[10px] text-corn-700 text-center">
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
                      ? 'w-5 h-5 flex items-center justify-center rounded bg-corn-900 text-corn-100 font-sans text-[11px] font-semibold'
                      : 'w-5 h-5 flex items-center justify-center font-sans text-[11px] text-[#2A2118]/80'
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
        <span className="font-sans text-[10px] font-medium tracking-[0.18em] uppercase text-corn-700 block mb-3">
          Upcoming Deadlines
        </span>
        <div className="flex flex-col gap-3">
          {upcoming.map((comp) => (
            <Link
              key={comp.id}
              to="/auth?mode=signup"
              className="flex items-start gap-2 -mx-1 px-1 py-0.5 rounded hover:bg-corn-900/5 transition-colors"
            >
              <span className={cn('w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0', getDisciplineColor(comp.discipline).dot)} />
              <div className="flex-1 min-w-0">
                <div className="font-sans text-[0.8125rem] font-medium text-[#2A2118] leading-snug">
                  {comp.name}
                </div>
                <div className="font-sans text-[11px] text-corn-800/70">
                  {comp.location} · {comp.discipline}
                </div>
              </div>
              <span className="font-sans text-[10px] font-medium text-corn-900 bg-corn-500/25 rounded px-1.5 py-0.5 whitespace-nowrap">
                Deadline {formatShortDate(comp.deadline)}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white/60 border border-corn-900/10 rounded-lg p-4">
        <span className="font-sans text-[10px] font-medium tracking-[0.18em] uppercase text-corn-700 block mb-3">
          Daily Reminders
        </span>
        <div className="flex flex-col gap-2.5">
          {upcoming.map((comp) => {
            const daysUntil = Math.round((comp.deadline.getTime() - today.getTime()) / 86400000)
            const label = daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`
            return (
              <div key={comp.id} className="flex items-start gap-2">
                <Bell size={12} strokeWidth={1.8} className="text-corn-700 mt-0.5 flex-shrink-0" />
                <span className="font-sans text-[11px] text-corn-800/85 leading-snug">
                  <span className="text-[#2A2118] font-medium">{comp.name}</span> deadline {label}.
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
