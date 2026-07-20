import * as React from 'react'
import { Button } from '@/components/ui/button'
import { ReasonDialog } from '@/components/admin/ReasonDialog'
import { errorDetail, errorMessage } from '@/lib/utils'
import * as adminApi from '@/lib/api/admin'
import type { AdminRoleRow } from '@/lib/api/admin'
import type { Role } from '@/lib/auth-context'
import { currentUid } from '@/lib/api/profiles'

const ROLE_LABEL: Record<Role, string> = {
  builder: 'Builder',
  'community-lead': 'Community Lead',
  admin: 'Admin',
  'super-admin': 'Super Admin',
}

type PendingAction = { kind: 'assign'; role: 'community-lead' | 'admin'; row: AdminRoleRow } | { kind: 'revoke'; row: AdminRoleRow }

export function AdminRoles() {
  const [rows, setRows] = React.useState<AdminRoleRow[]>([])
  const [myId, setMyId] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [actionError, setActionError] = React.useState<string | null>(null)
  const [notice, setNotice] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState<PendingAction | null>(null)

  const refresh = React.useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [roles, uid] = await Promise.all([adminApi.fetchUserRoles(), currentUid()])
      setRows(roles.filter((r) => r.role !== 'super-admin').sort((a, b) => a.displayName.localeCompare(b.displayName)))
      setMyId(uid)
    } catch (err) {
      setLoadError(errorMessage(err, 'Failed to load roles.'))
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  async function handleConfirm(reason: string) {
    if (!pending) return
    setActionError(null)
    try {
      const moderatorId = await currentUid()
      if (!moderatorId) throw new Error('No active session.')
      if (pending.kind === 'assign') {
        await adminApi.assignRole({ moderatorId, userId: pending.row.userId, role: pending.role, reason })
      } else {
        await adminApi.revokeRole({ moderatorId, userId: pending.row.userId, reason })
      }
      setPending(null)
      setNotice(`${pending.row.displayName}'s role was updated. They must sign out and back in for it to take effect.`)
      await refresh()
    } catch (err) {
      const detail = errorDetail(err)
      setActionError(detail ? `Couldn't update role: ${detail}` : "Couldn't update role.")
    }
  }

  if (loadError) return <p className="font-sans text-[13px] text-red-400">{loadError}</p>

  return (
    <div>
      {notice && <p className="font-sans text-[13px] text-gold-dark mb-4">{notice}</p>}
      {actionError && <p className="font-sans text-[13px] text-red-400 mb-4">{actionError}</p>}

      <div className="border border-white/10 rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_160px_260px] gap-3 px-4 py-2.5 bg-white/5 font-sans text-[11px] uppercase tracking-wide text-dark-muted">
          <span>Name</span>
          <span>Role</span>
          <span>Actions</span>
        </div>
        {rows.map((row) => {
          const isSelf = row.userId === myId
          return (
            <div
              key={row.userId}
              className="grid grid-cols-[1fr_160px_260px] gap-3 px-4 py-3 border-t border-white/8 font-sans text-[13px] items-center"
            >
              <span className="text-dark-text">{row.displayName || '(unnamed)'}</span>
              <span className="text-dark-muted">{ROLE_LABEL[row.role]}</span>
              <div className="flex gap-2">
                {row.role === 'builder' && (
                  <>
                    <Button
                      variant="shell"
                      size="sm"
                      disabled={isSelf}
                      onClick={() => setPending({ kind: 'assign', role: 'community-lead', row })}
                    >
                      Make Lead
                    </Button>
                    <Button variant="shell" size="sm" disabled={isSelf} onClick={() => setPending({ kind: 'assign', role: 'admin', row })}>
                      Make Admin
                    </Button>
                  </>
                )}
                {(row.role === 'community-lead' || row.role === 'admin') && (
                  <Button variant="danger" size="sm" disabled={isSelf} onClick={() => setPending({ kind: 'revoke', row })}>
                    Revoke
                  </Button>
                )}
                {isSelf && <span className="font-sans text-[11px] text-dark-muted self-center">(you)</span>}
              </div>
            </div>
          )
        })}
        {!loading && rows.length === 0 && (
          <p className="font-sans text-[13px] text-dark-muted px-4 py-4">No users found.</p>
        )}
      </div>

      {pending && (
        <ReasonDialog
          title={pending.kind === 'assign' ? `Assign ${ROLE_LABEL[pending.role]}` : 'Revoke role'}
          body={
            pending.kind === 'assign'
              ? `${pending.row.displayName} will become ${ROLE_LABEL[pending.role]}. This only takes effect after they next sign in.`
              : `${pending.row.displayName} will be reverted to Builder. This only takes effect after they next sign in.`
          }
          confirmLabel={pending.kind === 'assign' ? 'Assign' : 'Revoke'}
          danger={pending.kind === 'revoke'}
          onConfirm={(reason) => void handleConfirm(reason)}
          onClose={() => setPending(null)}
        />
      )}
    </div>
  )
}
