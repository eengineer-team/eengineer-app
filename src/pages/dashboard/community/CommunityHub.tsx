import { COMMUNITY_GROUPS } from '@/lib/community-groups'
import { DisciplineGroupCard } from '@/components/community/DisciplineGroupCard'
import { PeerActivity } from '@/components/dashboard/PeerActivity'

export function CommunityHub() {
  return (
    <div className="flex-1 w-full px-8 py-8 max-w-[1180px] mx-auto">
      <div className="flex flex-col lg:flex-row gap-10">
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-xl font-semibold text-dark-text mb-1">Community</h1>
          <p className="font-sans text-[0.8125rem] text-dark-muted mb-6">
            Pick a discipline to see its Q&amp;A, webinars, and members.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COMMUNITY_GROUPS.map((group) => (
              <DisciplineGroupCard key={group.discipline} group={group} />
            ))}
          </div>
        </div>

        <PeerActivity className="lg:w-[280px] flex-shrink-0" />
      </div>
    </div>
  )
}
