import * as React from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { disciplineFromSlug } from '@/lib/community-data'
import { QAFeed } from '@/pages/dashboard/community/QAFeed'
import { Webinars } from '@/pages/dashboard/community/Webinars'
import { Network } from '@/pages/dashboard/community/Network'
import { Networking } from '@/pages/dashboard/community/Networking'
import { Discussion } from '@/pages/dashboard/community/Discussion'
import { useAuth } from '@/lib/auth-context'
import { can } from '@/lib/permissions'
import { getDisciplineColor } from '@/lib/discipline-colors'
import { getDisciplineIcon } from '@/lib/discipline-icons'
import { cn } from '@/lib/utils'

type Tab = 'qa' | 'webinars' | 'members' | 'networking' | 'discussion'

const TABS: { id: Tab; label: string }[] = [
  { id: 'qa', label: 'Community' },
  { id: 'webinars', label: 'Webinars' },
  { id: 'members', label: 'Members' },
  { id: 'networking', label: 'Networking' },
  { id: 'discussion', label: 'Discussion' },
]

export function CommunityGroup() {
  const { discipline: slug } = useParams<{ discipline: string }>()
  const discipline = slug ? disciplineFromSlug(slug) : undefined
  const { user } = useAuth()
  const canVote = can(user, 'community:vote')
  const canSeeWebinars = can(user, 'community:webinars:view')
  const canSeeMembers = can(user, 'community:network:view')
  const canSeeNetworking = can(user, 'community:networking:view')
  const canSeeDiscussion = can(user, 'community:discussion:view')
  const [tab, setTab] = React.useState<Tab>('qa')
  const tabs = TABS.filter(
    (t) =>
      t.id === 'qa' ||
      (t.id === 'webinars' && canSeeWebinars) ||
      (t.id === 'members' && canSeeMembers) ||
      (t.id === 'networking' && canSeeNetworking) ||
      (t.id === 'discussion' && canSeeDiscussion)
  )

  if (!discipline) return <Navigate to="/dashboard/community" replace />

  const color = getDisciplineColor(discipline)
  const Icon = getDisciplineIcon(discipline)

  return (
    <div className="relative flex-1 w-full px-8 py-8 max-w-[720px] mx-auto overflow-hidden">
      {/* Faded discipline icon — same idea as the hub card banners, so a
          group's background reads as "which discipline" (via color + icon)
          even before you read any text. */}
      <Icon
        size={340}
        strokeWidth={1}
        className={cn('absolute -top-10 -right-16 opacity-[0.05]', color.text)}
      />

      <div className="relative">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 mb-6 font-sans text-[0.8125rem]">
        <Link to="/dashboard/community" className="text-dark-muted hover:text-white/85 transition-colors">
          Community
        </Link>
        <ChevronRight size={13} strokeWidth={2} className="text-white/30" />
        <span className="text-dark-text font-medium">{discipline}</span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-8 border-b border-white/8">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative px-4 py-2.5 font-sans text-[0.8125rem] font-medium transition-colors duration-150 ${
              tab === t.id ? 'text-white' : 'text-dark-muted hover:text-white/75'
            }`}
          >
            {t.label}
            {tab === t.id && <span className="absolute left-4 right-4 -bottom-px h-px bg-corn-700" />}
          </button>
        ))}
      </div>

      {tab === 'qa' && <QAFeed readOnly={!canVote} discipline={discipline} />}
      {tab === 'webinars' && canSeeWebinars && <Webinars discipline={discipline} />}
      {tab === 'members' && canSeeMembers && <Network discipline={discipline} />}
      {tab === 'networking' && canSeeNetworking && <Networking discipline={discipline} />}
      {tab === 'discussion' && canSeeDiscussion && <Discussion discipline={discipline} />}
      </div>
    </div>
  )
}
