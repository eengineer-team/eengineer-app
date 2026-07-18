import * as React from 'react'
import { MessageCircle, Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useJoinedClubs } from '@/lib/clubs-context'
import { getGroupMeta } from '@/lib/community-groups'
import { disciplineSlug } from '@/lib/community-data'
import { LabelCaps } from '@/components/ui/label-caps'

// Redesigned per founder feedback: no discipline color-coding, no member
// count — just a circled chat icon, the club name, and a notification
// indicator. Pressing a row previews the latest message inline instead of
// jumping straight into the group; "Open chat" still does the full navigate.
export function JoinedClubs() {
  const [expanded, setExpanded] = React.useState<string | null>(null)
  const { joinedClubs } = useJoinedClubs()

  return (
    <div>
      <LabelCaps className="block mb-3">Joined Clubs</LabelCaps>

      {joinedClubs.length === 0 ? (
        <p className="font-sans text-[0.8125rem] text-dark-muted">
          You haven't joined a club yet.{' '}
          <Link to="/dashboard/community" className="text-gold-dark hover:brightness-110 transition-all">
            Browse disciplines →
          </Link>
        </p>
      ) : (
      <div className="flex flex-col gap-2">
        {joinedClubs.map((club) => {
          const meta = getGroupMeta(club.name)
          const isOpen = expanded === club.name
          // Only a real unread message count lights this up — general
          // discipline activity (meta.recentActivityCount, e.g. new Q&A
          // posts) isn't a message and shouldn't trigger a "new message"
          // indicator on a club you've already read.
          const hasNotification = !!club.unreadCount

          return (
            <div
              key={club.name}
              className="rounded-lg bg-white/[0.03] border border-white/8 hover:border-white/15 transition-colors duration-150 overflow-hidden"
            >
              <button
                onClick={() => setExpanded(isOpen ? null : club.name)}
                aria-expanded={isOpen}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                <span className="relative w-8 h-8 rounded-full bg-white/8 flex items-center justify-center flex-shrink-0">
                  <MessageCircle size={15} strokeWidth={1.8} className="text-white/70" />
                  {hasNotification && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-gold-dark border-2 border-dark-100" />
                  )}
                </span>
                <span className="flex-1 min-w-0 font-sans text-[0.875rem] font-medium text-dark-text truncate">
                  {club.name}
                </span>
                {hasNotification && (
                  <Bell size={14} strokeWidth={1.8} className="text-gold-dark flex-shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-4 pb-3 pt-0.5 -mt-1">
                  <div className="rounded-md bg-white/[0.03] border border-white/8 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-sans text-[0.75rem] font-medium text-white/80">
                        {meta.latestMessage.author}
                      </span>
                      <span className="font-sans text-[12px] text-dark-muted flex-shrink-0">
                        {meta.latestMessage.time}
                      </span>
                    </div>
                    <p className="font-sans text-[0.75rem] text-dark-muted leading-snug line-clamp-2 mb-2">
                      {meta.latestMessage.text}
                    </p>
                    <Link
                      to={`/dashboard/community/${disciplineSlug(club.name)}`}
                      className="font-sans text-[13px] font-medium text-gold-dark hover:brightness-110 transition-all"
                    >
                      Open chat →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      )}
    </div>
  )
}
