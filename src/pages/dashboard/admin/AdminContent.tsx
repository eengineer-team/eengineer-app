import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { ReasonDialog } from '@/components/admin/ReasonDialog'
import { formatRelativeTime } from '@/lib/api/community'
import { DISCIPLINES, type Discipline } from '@/lib/community-data'
import * as adminApi from '@/lib/api/admin'
import type { ContentRow, ModerationTargetType } from '@/lib/api/admin'
import { currentUid } from '@/lib/api/profiles'

const TYPE_TABS: { value: ModerationTargetType; label: string }[] = [
  { value: 'question', label: 'Questions' },
  { value: 'question_comment', label: 'Comments' },
  { value: 'introduction', label: 'Introductions' },
  { value: 'discussion_post', label: 'Discussion posts' },
]

export function AdminContent() {
  const [targetType, setTargetType] = React.useState<ModerationTargetType>('question')
  const [discipline, setDiscipline] = React.useState<Discipline | null>(null)
  const [rows, setRows] = React.useState<ContentRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [actionError, setActionError] = React.useState<string | null>(null)
  const [target, setTarget] = React.useState<ContentRow | null>(null)

  const refresh = React.useCallback(async (t: ModerationTargetType, d: Discipline | null) => {
    setLoading(true)
    setLoadError(null)
    try {
      setRows(await adminApi.fetchContent(t, d ?? undefined))
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load content.')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void refresh(targetType, discipline)
  }, [targetType, discipline, refresh])

  async function handleRemove(row: ContentRow, reason: string) {
    setActionError(null)
    try {
      const moderatorId = await currentUid()
      if (!moderatorId) throw new Error('No active session.')
      await adminApi.removeContent({ moderatorId, targetType: row.targetType, targetId: row.id, reason })
      setTarget(null)
      await refresh(targetType, discipline)
    } catch (err) {
      setActionError(err instanceof Error ? `Couldn't remove that content: ${err.message}` : "Couldn't remove that content.")
    }
  }

  const showDisciplineFilter = targetType !== 'question_comment'

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setTargetType(tab.value)}
            className={cn(
              'font-sans text-[12px] px-3 py-1.5 rounded-full border transition-colors duration-150',
              targetType === tab.value
                ? 'text-white bg-white/10 border-white/20'
                : 'text-dark-muted border-white/10 hover:text-white/80 hover:bg-white/5'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {showDisciplineFilter && (
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <button
            onClick={() => setDiscipline(null)}
            className={cn(
              'font-sans text-[12px] px-3 py-1.5 rounded-full border transition-colors duration-150',
              discipline === null
                ? 'text-white bg-white/10 border-white/20'
                : 'text-dark-muted border-white/10 hover:text-white/80 hover:bg-white/5'
            )}
          >
            All disciplines
          </button>
          {DISCIPLINES.map((d) => (
            <button
              key={d}
              onClick={() => setDiscipline(d)}
              className={cn(
                'font-sans text-[12px] px-3 py-1.5 rounded-full border transition-colors duration-150',
                discipline === d
                  ? 'text-corn-500 bg-corn-700/15 border-corn-700/30'
                  : 'text-dark-muted border-white/10 hover:text-white/80 hover:bg-white/5'
              )}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      {loadError && <p className="font-sans text-[13px] text-red-400 mb-4">{loadError}</p>}
      {actionError && <p className="font-sans text-[13px] text-red-400 mb-4">{actionError}</p>}
      {!loading && rows.length === 0 && !loadError && (
        <p className="font-sans text-[13px] text-dark-muted">Nothing here.</p>
      )}

      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-sans text-[12px] text-dark-muted">
                <span className="text-dark-text">{row.authorName}</span> · {formatRelativeTime(row.createdAt)}
              </span>
              {row.discipline && <Chip discipline={row.discipline}>{row.discipline}</Chip>}
            </div>
            <p className="font-sans text-[13px] text-dark-text mb-3">{row.text}</p>
            <div className="flex justify-end">
              <Button variant="danger" size="sm" onClick={() => setTarget(row)}>
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      {target && (
        <ReasonDialog
          title="Remove content"
          body="This deletes the content permanently. The text is snapshotted to the moderation log first."
          confirmLabel="Remove"
          danger
          onConfirm={(reason) => void handleRemove(target, reason)}
          onClose={() => setTarget(null)}
        />
      )}
    </div>
  )
}
