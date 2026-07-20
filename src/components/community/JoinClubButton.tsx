import * as React from 'react'
import type { Discipline } from '@/lib/community-data'
import { useJoinedClubs } from '@/lib/clubs-context'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/lib/utils'

// Join is one click (reversible, low-stakes). Leave confirms inline — it
// doesn't destroy anything, but it silently empties JoinedClubs/PeerActivity
// on the dashboard, so a stray click shouldn't do that with no chance to
// back out. Deliberately not the ConfirmDialog popover used elsewhere: this
// renders inside DisciplineGroupCard, which clips with overflow-hidden for
// its banner's rounded corners, so an absolutely-positioned popover would get
// cut off there. An inline two-step swap has no positioning to clip.
export function JoinClubButton({ discipline }: { discipline: Discipline }) {
  const { isJoined, join, leave } = useJoinedClubs()
  const joined = isJoined(discipline)
  const [confirming, setConfirming] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleJoin(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setError(null)
    setPending(true)
    try {
      await join(discipline)
    } catch (err) {
      setError(errorMessage(err, "Couldn't join."))
    } finally {
      setPending(false)
    }
  }

  async function handleLeaveConfirmed(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setError(null)
    setPending(true)
    try {
      await leave(discipline)
      setConfirming(false)
    } catch (err) {
      setError(errorMessage(err, "Couldn't leave."))
    } finally {
      setPending(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-sans text-[12px] text-dark-muted">Leave {discipline}?</span>
        <Button
          variant="danger"
          size="sm"
          disabled={pending}
          onClick={(e) => void handleLeaveConfirmed(e)}
        >
          {pending ? 'Leaving…' : 'Confirm'}
        </Button>
        <Button
          variant="shell"
          size="sm"
          disabled={pending}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setConfirming(false)
          }}
        >
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <div>
      <Button
        variant={joined ? 'shell' : 'accent'}
        size="sm"
        disabled={pending}
        onClick={(e) => {
          if (joined) {
            e.preventDefault()
            e.stopPropagation()
            setConfirming(true)
          } else {
            void handleJoin(e)
          }
        }}
      >
        {joined ? 'Leave' : 'Join'}
      </Button>
      {error && (
        <p className="mt-1 font-sans text-[11px] text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
