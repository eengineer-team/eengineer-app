import { CalendarDays, Users, Plus } from 'lucide-react'
import { JoinedClubs } from '@/components/dashboard/JoinedClubs'
import { Button } from '@/components/ui/button'

export function DashboardHome() {
  return (
    <div className="flex-1 flex gap-10 px-8 py-8">
      {/* Left column */}
      <div className="flex-1 max-w-[560px] flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <span className="font-sans text-[11px] font-medium tracking-[0.16em] uppercase text-white/45">
            Overview
          </span>
          {/* [DEFERRED] Post a Project — UI hook only, flow not implemented yet */}
          <Button variant="shell" size="sm" disabled title="Coming soon">
            <Plus size={14} strokeWidth={2} />
            Post a Project
          </Button>
        </div>

        <JoinedClubs />
      </div>

      {/* Right column — space above the webinar card stays intentionally empty
          until Community/Opportunities content lands here (Phases 6-7). */}
      <div className="w-[320px] flex-shrink-0 flex flex-col justify-end">
        <div className="bg-white/[0.03] border border-white/8 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-sans text-[10px] font-medium tracking-[0.18em] uppercase text-white/45">
              Next webinar
            </span>
            <CalendarDays size={12} strokeWidth={1.8} className="text-white/45" />
          </div>
          <div className="font-sans text-[0.875rem] font-semibold text-white/90 leading-snug mb-1">
            Aerospace Propulsion Systems
          </div>
          <div className="font-sans text-[11px] text-white/45 mb-3">
            Aerospace · Fri, Jul 18 · 5:00 PM EST
          </div>
          <div className="h-px bg-white/8 mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-white/45">
              <Users size={11} strokeWidth={1.8} />
              <span className="font-sans text-[11px]">23 attending</span>
            </div>
            <button className="font-sans text-[11px] font-semibold text-white/90 hover:text-white transition-colors tracking-wide">
              Register →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
