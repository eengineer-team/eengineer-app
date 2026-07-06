import { Users } from 'lucide-react'
import { JOINED_CLUBS } from '@/lib/clubs-data'
import { getDisciplineColor } from '@/lib/discipline-colors'
import { cn } from '@/lib/utils'

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
            <div className="flex items-center gap-2.5">
              <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', getDisciplineColor(club.name).dot)} />
              <span className="font-sans text-[0.875rem] font-medium text-white/90">
                {club.name}
              </span>
            </div>
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
