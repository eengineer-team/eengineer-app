import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getAllDeadlines } from '@/lib/deadlines'
import { LabelCaps } from '@/components/ui/label-caps'
import { cn } from '@/lib/utils'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface CalendarYearViewProps {
  year: number
  onYearChange: (year: number) => void
  onSelectMonth: (monthIndex: number) => void
}

// Top level of the Calendar's year -> month -> detail flow: 12 months for the
// given year, each showing how many competitions/programs/opportunities have
// a deadline that month. Months before the current one (in the current year)
// are shown but not selectable -- same "past dates are never shown as active"
// rule the month grid already followed.
export function CalendarYearView({ year, onYearChange, onSelectMonth }: CalendarYearViewProps) {
  const now = new Date()
  const isCurrentYear = year === now.getFullYear()
  const deadlines = getAllDeadlines()

  const countsByMonth = new Array(12).fill(0)
  for (const item of deadlines) {
    if (item.deadline.getFullYear() === year) {
      countsByMonth[item.deadline.getMonth()] += 1
    }
  }

  function isMonthPast(monthIndex: number): boolean {
    return isCurrentYear && monthIndex < now.getMonth()
  }

  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <LabelCaps>Competition Calendar</LabelCaps>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onYearChange(year - 1)}
            disabled={year <= now.getFullYear()}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded text-dark-muted hover:bg-white/7 hover:text-white/80 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Previous year"
          >
            <ChevronLeft size={14} strokeWidth={2} />
          </button>
          <span className="font-sans text-[0.9375rem] font-semibold text-dark-text w-14 text-center">
            {year}
          </span>
          <button
            onClick={() => onYearChange(year + 1)}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded text-dark-muted hover:bg-white/7 hover:text-white/80 transition-colors"
            aria-label="Next year"
          >
            <ChevronRight size={14} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {MONTH_NAMES.map((name, i) => {
          const past = isMonthPast(i)
          const count = countsByMonth[i]
          const isThisMonth = isCurrentYear && i === now.getMonth()
          return (
            <button
              key={name}
              onClick={() => !past && onSelectMonth(i)}
              disabled={past}
              className={cn(
                'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors',
                past
                  ? 'border-white/5 opacity-30 pointer-events-none'
                  : 'border-white/8 hover:border-white/20 hover:bg-white/[0.04]',
                isThisMonth && !past && 'border-gold-dark/40 bg-gold-dark/5',
              )}
            >
              <span className="font-sans text-[0.8125rem] font-medium text-dark-text">{name}</span>
              <span className="font-sans text-[11px] text-dark-muted">
                {count === 0 ? 'No deadlines' : count === 1 ? '1 deadline' : `${count} deadlines`}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
