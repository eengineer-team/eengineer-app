import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ReasonDialog } from '@/components/admin/ReasonDialog'
import { formatRelativeTime } from '@/lib/api/community'
import * as adminApi from '@/lib/api/admin'
import type { ModerationTargetType, ReportRow, ResolvedTargetContent } from '@/lib/api/admin'
import { currentUid } from '@/lib/api/profiles'

type StatusFilter = 'open' | 'actioned' | 'dismissed' | 'all'

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'actioned', label: 'Actioned' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: 'all', label: 'All' },
]

const TARGET_LABEL: Record<string, string> = {
  question: 'Question',
  question_comment: 'Comment',
  introduction: 'Introduction',
  discussion_post: 'Discussion post',
}

export function AdminReports() {
  const [status, setStatus] = React.useState<StatusFilter>('open')
  const [reports, setReports] = React.useState<ReportRow[]>([])
  const [contentByReport, setContentByReport] = React.useState<Record<string, ResolvedTargetContent>>({})
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [actionError, setActionError] = React.useState<string | null>(null)
  const [dialog, setDialog] = React.useState<{ report: ReportRow; kind: 'remove' | 'dismiss' } | null>(null)

  const refresh = React.useCallback(async (s: StatusFilter) => {
    setLoading(true)
    setLoadError(null)
    try {
      const rows = await adminApi.fetchReports(s)
      setReports(rows)
      const contentEntries = await Promise.all(
        rows.map(async (r) => [r.id, await adminApi.resolveTargetContent(r.targetType, r.targetId)] as const)
      )
      setContentByReport(Object.fromEntries(contentEntries))
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load the report queue.')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void refresh(status)
  }, [status, refresh])

  async function handleRemove(report: ReportRow, reason: string) {
    setActionError(null)
    try {
      const moderatorId = await currentUid()
      if (!moderatorId) throw new Error('No active session.')
      await adminApi.removeContent({
        moderatorId,
        targetType: report.targetType as ModerationTargetType,
        targetId: report.targetId,
        reason,
        reportId: report.id,
      })
      setDialog(null)
      await refresh(status)
    } catch (err) {
      setActionError(err instanceof Error ? `Couldn't remove that content: ${err.message}` : "Couldn't remove that content.")
    }
  }

  async function handleDismiss(report: ReportRow, reason: string) {
    setActionError(null)
    try {
      const moderatorId = await currentUid()
      if (!moderatorId) throw new Error('No active session.')
      await adminApi.dismissReport({ moderatorId, reportId: report.id, reason })
      setDialog(null)
      await refresh(status)
    } catch (err) {
      setActionError(err instanceof Error ? `Couldn't dismiss that report: ${err.message}` : "Couldn't dismiss that report.")
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value)}
            className={cn(
              'font-sans text-[12px] px-3 py-1.5 rounded-full border transition-colors duration-150',
              status === tab.value
                ? 'text-white bg-white/10 border-white/20'
                : 'text-dark-muted border-white/10 hover:text-white/80 hover:bg-white/5'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loadError && <p className="font-sans text-[13px] text-red-400 mb-4">{loadError}</p>}
      {actionError && <p className="font-sans text-[13px] text-red-400 mb-4">{actionError}</p>}

      {!loading && reports.length === 0 && !loadError && (
        <p className="font-sans text-[13px] text-dark-muted">No {status === 'all' ? '' : status} reports.</p>
      )}

      <div className="flex flex-col gap-3">
        {reports.map((report) => {
          const content = contentByReport[report.id]
          return (
            <div key={report.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-sans text-[12px] text-dark-muted">
                  {TARGET_LABEL[report.targetType] ?? report.targetType} reported by{' '}
                  <span className="text-dark-text">{report.reporterName}</span> · {formatRelativeTime(report.createdAt)}
                </span>
                <span
                  className={cn(
                    'font-sans text-[11px] px-2 py-0.5 rounded-full border',
                    report.status === 'open' && 'text-gold-dark border-gold-dark/40 bg-gold-dark/10',
                    report.status === 'actioned' && 'text-red-400 border-red-500/40 bg-red-500/10',
                    report.status === 'dismissed' && 'text-dark-muted border-white/10 bg-white/5'
                  )}
                >
                  {report.status}
                </span>
              </div>

              <p className="font-sans text-[13px] text-dark-text mb-2">
                <span className="text-dark-muted">Reason: </span>
                {report.reason || '(no reason given)'}
              </p>

              <div className="bg-black/20 border border-white/8 rounded px-3 py-2 mb-3">
                {content === undefined ? (
                  <p className="font-sans text-[13px] text-dark-muted">Loading content…</p>
                ) : content.exists ? (
                  <p className="font-sans text-[13px] text-dark-text">
                    <span className="text-dark-muted">{content.authorName}: </span>
                    {content.text}
                  </p>
                ) : (
                  <p className="font-sans text-[13px] text-dark-muted italic">
                    This content no longer exists — it may already have been removed.
                  </p>
                )}
              </div>

              {report.status === 'open' && (
                <div className="flex justify-end gap-2">
                  <Button variant="shell" size="sm" onClick={() => setDialog({ report, kind: 'dismiss' })}>
                    Dismiss
                  </Button>
                  {content?.exists && (
                    <Button variant="danger" size="sm" onClick={() => setDialog({ report, kind: 'remove' })}>
                      Remove content
                    </Button>
                  )}
                </div>
              )}

              {report.status !== 'open' && (
                <p className="font-sans text-[11px] text-dark-muted text-right">
                  Resolved {report.resolvedAt ? formatRelativeTime(report.resolvedAt) : ''}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {dialog && dialog.kind === 'remove' && (
        <ReasonDialog
          title="Remove content"
          body="This deletes the content permanently and marks the report as actioned. The text is snapshotted to the moderation log first."
          confirmLabel="Remove"
          danger
          onConfirm={(reason) => void handleRemove(dialog.report, reason)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog && dialog.kind === 'dismiss' && (
        <ReasonDialog
          title="Dismiss report"
          body="The report is marked resolved without removing anything."
          confirmLabel="Dismiss"
          onConfirm={(reason) => void handleDismiss(dialog.report, reason)}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  )
}
