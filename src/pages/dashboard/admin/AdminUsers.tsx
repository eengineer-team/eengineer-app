import * as React from 'react'
import { Chip } from '@/components/ui/chip'
import { errorMessage } from '@/lib/utils'
import * as adminApi from '@/lib/api/admin'
import type { AdminProfileRow } from '@/lib/api/admin'

export function AdminUsers() {
  const [rows, setRows] = React.useState<AdminProfileRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    adminApi
      .fetchAllProfiles()
      .then((r) => !cancelled && setRows(r))
      .catch((err) => !cancelled && setLoadError(errorMessage(err, 'Failed to load users.')))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  if (loadError) return <p className="font-sans text-[13px] text-red-400">{loadError}</p>
  if (!loading && rows.length === 0) return <p className="font-sans text-[13px] text-dark-muted">No users found.</p>

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      <div className="grid grid-cols-[1fr_140px_100px_140px] gap-3 px-4 py-2.5 bg-white/5 font-sans text-[11px] uppercase tracking-wide text-dark-muted">
        <span>Name</span>
        <span>Discipline</span>
        <span>Verified</span>
        <span>Joined</span>
      </div>
      {rows.map((row) => (
        <div
          key={row.id}
          className="grid grid-cols-[1fr_140px_100px_140px] gap-3 px-4 py-3 border-t border-white/8 font-sans text-[13px] items-center"
        >
          <span className="text-dark-text">{row.displayName || '(unnamed)'}</span>
          <Chip discipline={row.discipline}>{row.discipline}</Chip>
          <span className={row.verified ? 'text-gold-dark' : 'text-dark-muted'}>{row.verified ? 'Yes' : 'No'}</span>
          <span className="text-dark-muted">{new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      ))}
    </div>
  )
}
