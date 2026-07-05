import * as React from 'react'
import { QAFeed } from '@/pages/dashboard/community/QAFeed'
import { Webinars } from '@/pages/dashboard/community/Webinars'
import { Network } from '@/pages/dashboard/community/Network'
import { useAuth } from '@/lib/auth-context'
import { can } from '@/lib/permissions'

type Tab = 'qa' | 'webinars' | 'network'

const TABS: { id: Tab; label: string }[] = [
  { id: 'qa', label: 'Q&A' },
  { id: 'webinars', label: 'Webinars' },
  { id: 'network', label: 'My Network' },
]

export function Community() {
  const { user } = useAuth()
  // Spec: Community is Builder-only except the public Q&A overview, which
  // Google-preview sessions may browse read-only — Webinars/My Network stay hidden.
  const canVote = can(user, 'community:vote')
  const canSeeWebinars = can(user, 'community:webinars:view')
  const canSeeNetwork = can(user, 'community:network:view')
  const [tab, setTab] = React.useState<Tab>('qa')
  const tabs = TABS.filter(
    (t) => t.id === 'qa' || (t.id === 'webinars' && canSeeWebinars) || (t.id === 'network' && canSeeNetwork)
  )

  return (
    <div className="flex-1 px-8 py-8 max-w-[720px]">
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-8 border-b border-white/8">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative px-4 py-2.5 font-sans text-[0.8125rem] font-medium transition-colors duration-150 ${
              tab === t.id ? 'text-white' : 'text-white/45 hover:text-white/75'
            }`}
          >
            {t.label}
            {tab === t.id && <span className="absolute left-4 right-4 -bottom-px h-px bg-corn-700" />}
          </button>
        ))}
      </div>

      {tab === 'qa' && <QAFeed readOnly={!canVote} />}
      {tab === 'webinars' && canSeeWebinars && <Webinars />}
      {tab === 'network' && canSeeNetwork && <Network />}
    </div>
  )
}
