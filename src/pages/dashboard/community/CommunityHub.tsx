import { COMMUNITY_GROUPS } from '@/lib/community-groups'
import { DisciplineGroupCard } from '@/components/community/DisciplineGroupCard'

export function CommunityHub() {
  return (
    <div className="flex-1 px-8 py-8 max-w-[960px]">
      <h1 className="font-display text-xl font-semibold text-white/95 mb-1">Community</h1>
      <p className="font-sans text-[0.8125rem] text-dark-muted mb-6">
        Pick a discipline to see its Q&amp;A, webinars, and members.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {COMMUNITY_GROUPS.map((group) => (
          <DisciplineGroupCard key={group.discipline} group={group} />
        ))}
      </div>
    </div>
  )
}
