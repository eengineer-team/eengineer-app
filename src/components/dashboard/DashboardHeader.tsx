import * as React from 'react'
import { CalendarClock, MessageSquare, MessageSquareHeart, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { can } from '@/lib/permissions'
import { useMessages } from '@/lib/messages-context'
import { useCompetitions } from '@/lib/competitions-context'
import { NotificationsBell } from '@/components/dashboard/NotificationsBell'
import { FeedbackDialog } from '@/components/dashboard/FeedbackDialog'
import * as feedbackApi from '@/lib/api/feedback'
import { errorMessage, cn } from '@/lib/utils'

function IconBadge({
  icon: Icon,
  count,
  label,
  onClick,
}: {
  icon: typeof CalendarClock
  count: number
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="relative min-w-[40px] min-h-[40px] flex items-center justify-center text-white/70 hover:text-white hover-white-tint rounded transition-colors duration-150"
      aria-label={count > 0 ? `${label}: ${count} unread` : label}
    >
      <Icon size={16} strokeWidth={1.8} />
      {count > 0 && (
        <span className="absolute top-2.5 right-2.5 w-[7px] h-[7px] rounded-full bg-corn-700" />
      )}
    </button>
  )
}

export function DashboardHeader({ name, onMenuClick }: { name: string; onMenuClick: () => void }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { unreadTotal } = useMessages()
  const { competitions } = useCompetitions()
  // Google preview can't reach Messages or Calendar (see permissions.ts) — hide
  // both badges for it instead of showing a count that just bounces to /auth.
  const canSeeBadges = can(user, 'messages:view')
  // Deadline-reminder count from the Calendar (see CompetitionCalendar's Daily
  // Reminders). Separate from NotificationsBell, which is the real per-user
  // notifications feed (currently: new webinars in your discipline).
  const reminderCount = competitions.length

  // Feedback — moved here from the sidebar per founder feedback: the header's
  // top-right corner (next to "Hello, {name}") is the spot people actually
  // look at first, not a footer entry below a long nav list.
  const [showFeedback, setShowFeedback] = React.useState(false)
  const [submittingFeedback, setSubmittingFeedback] = React.useState(false)
  const [feedbackError, setFeedbackError] = React.useState<string | null>(null)
  const [feedbackSent, setFeedbackSent] = React.useState(false)

  async function handleSubmitFeedback(rating: number, message: string) {
    const uid = await feedbackApi.currentUid()
    if (!uid) return
    setSubmittingFeedback(true)
    setFeedbackError(null)
    try {
      await feedbackApi.submitFeedback(uid, rating, message)
      setShowFeedback(false)
      setFeedbackSent(true)
      setTimeout(() => setFeedbackSent(false), 3000)
    } catch (err) {
      setFeedbackError(errorMessage(err, "Couldn't send feedback — try again in a moment."))
    } finally {
      setSubmittingFeedback(false)
    }
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 py-5 border-b border-white/8 bg-dark-100/90 backdrop-blur-sm">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="md:hidden min-w-[40px] min-h-[40px] flex-shrink-0 flex items-center justify-center text-white/70 hover:text-white hover-white-tint rounded transition-colors duration-150"
        >
          <Menu size={18} strokeWidth={1.8} />
        </button>
        <span className="font-display text-white text-[1.25rem] font-bold tracking-[-0.02em] truncate">
          Hello, {name}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setFeedbackError(null)
            setShowFeedback(true)
          }}
          className={cn(
            'flex items-center gap-1.5 h-[36px] px-3 rounded font-sans text-[0.8125rem] font-medium border transition-colors duration-150 flex-shrink-0',
            'text-gold-dark border-gold-dark/30 hover:bg-gold-dark/10',
          )}
        >
          <MessageSquareHeart size={15} strokeWidth={1.8} />
          <span className="hidden sm:inline">{feedbackSent ? 'Thanks!' : 'Feedback'}</span>
        </button>

        <div className="flex items-center gap-1">
          {canSeeBadges && (
            <>
              <IconBadge
                icon={MessageSquare}
                count={unreadTotal}
                label="Messages"
                onClick={() => navigate('/dashboard/messages')}
              />
              <IconBadge
                icon={CalendarClock}
                count={reminderCount}
                label="Upcoming deadlines"
                onClick={() => navigate('/dashboard/calendar')}
              />
              <NotificationsBell />
            </>
          )}
        </div>
      </div>

      {showFeedback && (
        <FeedbackDialog
          submitting={submittingFeedback}
          error={feedbackError}
          onSubmit={(rating, message) => void handleSubmitFeedback(rating, message)}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </header>
  )
}
