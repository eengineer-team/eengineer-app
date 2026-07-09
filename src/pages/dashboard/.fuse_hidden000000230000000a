import { CompetitionCalendar } from '@/components/dashboard/CompetitionCalendar'
import { LabelCaps } from '@/components/ui/label-caps'

// The sidebar's Calendar nav item used to land on a bare placeholder even
// though the widget (see DashboardHome's right column) already existed and
// worked — this just gives that same component a real full-page home
// instead of a dead-end route. Step 10's actual spec (dates-from-today,
// yellow deadline dots, Upcoming Deadlines, Daily Reminders) all lives in
// CompetitionCalendar.tsx already; nothing about the component changes here.
export function Calendar() {
  return (
    <div className="flex-1 px-8 py-8 max-w-[420px]">
      <LabelCaps className="block mb-1">Competition Calendar</LabelCaps>
      <p className="font-sans text-[0.8125rem] text-white/45 mb-6">
        Every upcoming deadline across disciplines — past dates are never shown.
      </p>
      <CompetitionCalendar />
    </div>
  )
}
