import { useState } from 'react'
import { ChevronLeft, ChevronRight, Bell } from 'lucide-react'
import { SEED_COMPETITIONS } from '@/lib/calendar-data'

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

export function CompetitionCalendar() {
  const today = startOfDay(new Date())
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const [viewMonth, setViewMonth] = useState(currentMonthStart)

  const isViewingCurrentMonth = isSameDay(viewMonth, currentMonthStart)
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate()
  const firstWeekday = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay()

  const deadlinesByDay = new Map<number, boolean>()
  for (const comp of SEED_COMPETITIONS) {
    if (comp.deadline.getFullYear() === viewMonth.getFullYear() && comp.deadline.getMonth() === viewMonth.getMonth()) {
      deadlinesByDay.set(comp.deadline.getDate(), true)
    }
  }

  const cells: (number | null)[] = Array.from({ length: firstWeekday }, () => null)
  for (let day = 1; day <= daysInMonth; day++) {
    // Past dates are excluded from the active view entirely, not just dimmed.
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
    <div className="flex flex-col gap-4">
      <div className="bg-white/[0.03] border border-white/8 rounded-lg p-4">
        <span className="font-sans text-[10px] font-medium tracking-[0.18em] uppercase text-white/45 block mb-3">
          Competition Calendar
        </span>

        <div className="flex items-center justify-between mb-3">
          <span className="font-sans text-[0.875rem] font-semibold text-white/90">
            {MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrevMonth}
              disabled={isViewingCurrentMonth}
              className="p-1 rounded text-white/45 hover:bg-white/7 hover:text-white/80 transition-colors disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Previous month"
            >
              <ChevronLeft size={14} strokeWidth={2} />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-1 rounded text-white/45 hover:bg-white/7 hover:text-white/80 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight size={14} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-y-1.5 mb-1">
          {WEEKDAYS.map((wd) => (
            <span key={wd} className="font-sans text-[10px] text-white/30 text-center">
              {wd}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1.5">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />
            const isToday = isViewingCurrentMonth && day === today.getDate()
            const hasDeadline = deadlinesByDay.has(day)
            return (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <span
                  className={
                    isToday
                      ? 'w-5 h-5 flex items-center justify-center rounded bg-white text-dark-200 font-sans text-[11px] font-semibold'
                      : 'w-5 h-5 flex items-center justify-center font-sans text-[11px] text-white/70'
                  }
                >
                  {day}
                </span>
                <span className={hasDeadline ? 'w-1 h-1 rounded-full bg-corn-500' : 'w-1 h-1'} />
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/8 rounded-lg p-4">
        <span className="font-sans text-[10px] font-medium tracking-[0.18em] uppercase text-white/45 block mb-3">
          Upcoming Deadlines
        </span>
        <div className="flex flex-col gap-3">
          {upcoming.map((comp) => (
            <div key={comp.id} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-corn-500 mt-1.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-sans text-[0.8125rem] font-medium text-white/90 leading-snug">
                  {comp.name}
                </div>
                <div className="font-sans text-[11px] text-white/45">
                  {comp.location} · {comp.discipline}
                </div>
              </div>
              <span className="font-sans text-[10px] font-medium text-corn-500 bg-corn-500/10 rounded px-1.5 py-0.5 whitespace-nowrap">
                Deadline {formatShortDate(comp.deadline)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/8 rounded-lg p-4">
        <span className="font-sans text-[10px] font-medium tracking-[0.18em] uppercase text-white/45 block mb-3">
          Daily Reminders
        </span>
        <div className="flex flex-col gap-2.5">
          {upcoming.map((comp) => {
            const daysUntil = Math.round((comp.deadline.getTime() - today.getTime()) / 86400000)
            const label = daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`
            return (
              <div key={comp.id} className="flex items-start gap-2">
                <Bell size={12} strokeWidth={1.8} className="text-white/45 mt-0.5 flex-shrink-0" />
                <span className="font-sans text-[11px] text-white/60 leading-snug">
                  <span className="text-white/90 font-medium">{comp.name}</span> deadline {label}.
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
