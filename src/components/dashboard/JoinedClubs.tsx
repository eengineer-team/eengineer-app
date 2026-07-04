import { Users } from 'lucide-react'

// Mock data — real-time membership/updates land once the Community backend exists (Phase 6).
const JOINED_CLUBS = [
  { name: 'Aerospace', members: 412 },
  { name: 'Software', members: 968 },
  { name: 'Mechanical', members: 355 },
]

export function JoinedClubs() {
  return (
    <div>
      <span className="font-sans text-[11px] font-medium tracking-[0.16em] uppercase text-white/45 block mb-3">
        Joined Clubs
      </span>

      <div className="flex flex-col gap-2">
        {JOINED_CLUBS.map((club) => (
          <div
            key={club.name}
            className="flex items-center justify-between px-4 py-3 rounded-lg bg-white/[0.03] border border-white/8"
          >
            <span className="font-sans text-[0.875rem] font-medium text-white/90">
              {club.name}
            </span>
            <div className="flex items-center gap-1.5 text-white/45">
              <Users size={12} strokeWidth={1.8} />
              <span className="font-sans text-[11px]">{club.members}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
