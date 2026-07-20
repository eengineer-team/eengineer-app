import * as React from 'react'
import { CalendarYearView } from '@/components/dashboard/calendar/CalendarYearView'
import { CalendarMonthView } from '@/components/dashboard/calendar/CalendarMonthView'
import { LabelCaps } from '@/components/ui/label-caps'

// Step 10's flow, per founder request: year view first (12 months, deadline
// counts per month) -> pick a month to see the classic 30-day grid -> pick a
// day/competition to land on its own detail page (a real route change, which
// is what "replaces the calendar UI" in practice). This page just holds the
// year/month state; CalendarYearView and CalendarMonthView do the rendering.
export function Calendar() {
  const now = new Date()
  const [screen, setScreen] = React.useState<'year' | 'month'>('year')
  const [year, setYear] = React.useState(now.getFullYear())
  const [month, setMonth] = React.useState(new Date(now.getFullYear(), now.getMonth(), 1))

  return (
    <div className="flex-1 w-full px-8 py-8 max-w-[560px] mx-auto">
      <LabelCaps className="block mb-1">Competition Calendar</LabelCaps>
      <p className="font-sans text-[0.8125rem] text-dark-muted mb-6">
        Every upcoming deadline across disciplines -- past dates are never shown.
      </p>

      {screen === 'year' ? (
        <CalendarYearView
          year={year}
          onYearChange={setYear}
          onSelectMonth={(monthIndex) => {
            setMonth(new Date(year, monthIndex, 1))
            setScreen('month')
          }}
        />
      ) : (
        <CalendarMonthView
          month={month}
          onBack={() => {
            setYear(month.getFullYear())
            setScreen('year')
          }}
          onChangeMonth={setMonth}
        />
      )}
    </div>
  )
}
