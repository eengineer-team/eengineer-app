import { Link } from 'react-router-dom'
import { X, Rocket, Users2, Compass } from 'lucide-react'
import { usePersistentState } from '@/lib/use-persistent-state'
import { LabelCaps } from '@/components/ui/label-caps'

const STEPS = [
  {
    icon: Rocket,
    title: 'Add a project',
    description: 'Post what you’re building so other Builders can find it.',
    to: '/dashboard/projects/mine',
  },
  {
    icon: Users2,
    title: 'Join a discipline club',
    description: 'Follow the community closest to what you work on.',
    to: '/dashboard/community',
  },
  {
    icon: Compass,
    title: 'Browse Builders',
    description: 'See who else is here and what they’re working on.',
    to: '/dashboard/profiles',
  },
]

// Shown only while the signed-in Builder's profile is genuinely empty (see
// the `isEmpty` check in DashboardHome) — a first-run cue, not a permanent
// fixture. Dismissible independent of that check so it doesn't reappear on
// every visit once someone's decided to explore on their own.
export function StartHere() {
  const [dismissed, setDismissed] = usePersistentState('ee:start-here-dismissed', false)

  if (dismissed) return null

  return (
    <div className="relative bg-white/[0.03] border border-white/8 rounded-lg p-4 md:p-5">
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded text-dark-muted hover:text-dark-text transition-colors"
      >
        <X size={15} strokeWidth={1.8} />
      </button>

      <LabelCaps className="block mb-1">Start here</LabelCaps>
      <p className="font-sans text-[0.8125rem] text-dark-muted mb-4 max-w-[85%]">
        Your dashboard is empty because you haven't added anything yet. Three ways to get going:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {STEPS.map((step) => (
          <Link
            key={step.title}
            to={step.to}
            className="flex flex-col gap-2 bg-white/[0.03] border border-white/8 rounded-lg p-3.5 hover:border-white/20 hover:bg-white/[0.05] transition-colors duration-150"
          >
            <step.icon size={16} strokeWidth={1.8} className="text-gold-dark" />
            <span className="font-sans text-[0.8125rem] font-semibold text-dark-text">{step.title}</span>
            <span className="font-sans text-[13px] text-dark-muted leading-snug">{step.description}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
