import * as React from 'react'
import { Star } from 'lucide-react'
import * as internalApi from '@/lib/api/internal'
import { errorMessage, cn } from '@/lib/utils'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 flex-shrink-0">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={13}
          strokeWidth={1.8}
          className={cn(n <= rating ? 'fill-[#F0F0F0] text-[#F0F0F0]' : 'text-[#F0F0F0]/20')}
        />
      ))}
    </div>
  )
}

export function InternalFeedback() {
  const [rows, setRows] = React.useState<internalApi.FeedbackEntry[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    internalApi
      .fetchFeedback()
      .then(setRows)
      .catch((err) => setError(errorMessage(err, 'Failed to load feedback.')))
  }, [])

  if (error) return <p className="font-sans text-[0.8125rem] text-red-400">{error}</p>
  if (!rows) return <p className="font-sans text-[0.8125rem] text-[#F0F0F0]/50">Loading…</p>

  const avgRating = rows.length ? rows.reduce((sum, r) => sum + r.rating, 0) / rows.length : 0

  return (
    <div>
      <p className="font-sans text-[0.8125rem] text-[#F0F0F0]/50 mb-4">
        {rows.length} submissions{rows.length > 0 && ` · avg ${avgRating.toFixed(1)}/5`}
      </p>
      <div className="flex flex-col gap-3">
        {rows.map((r) => (
          <div key={r.id} className="border border-[#F0F0F0]/10 rounded-lg p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <RatingStars rating={r.rating} />
                <span className="font-sans text-[0.8125rem] font-medium text-[#F0F0F0]">
                  {r.displayName ?? 'Unknown Builder'}
                </span>
              </div>
              <span className="font-sans text-[0.75rem] text-[#F0F0F0]/45 flex-shrink-0 whitespace-nowrap">
                {formatDate(r.createdAt)}
              </span>
            </div>
            <p className="font-sans text-[0.8125rem] text-[#F0F0F0]/80 leading-snug">{r.message}</p>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="font-sans text-[0.8125rem] text-[#F0F0F0]/40 text-center py-6 border border-[#F0F0F0]/10 rounded-lg">
            No feedback submitted yet.
          </p>
        )}
      </div>
    </div>
  )
}
