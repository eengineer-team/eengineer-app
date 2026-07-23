import * as React from 'react'
import * as internalApi from '@/lib/api/internal'
import { errorMessage } from '@/lib/utils'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Two things live on this tab: who registered for what (the data that used
// to only be visible via SQL), and organizer_email per competition -- the
// field notify-competition-registration needs to actually email an
// organizer, which never had any UI at all before this panel.
export function InternalCompetitions() {
  const [registrations, setRegistrations] = React.useState<internalApi.CompetitionRegistrationEntry[] | null>(null)
  const [competitions, setCompetitions] = React.useState<internalApi.CompetitionOrganizerEmail[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [draftEmail, setDraftEmail] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  const load = React.useCallback(() => {
    Promise.all([internalApi.fetchCompetitionRegistrations(), internalApi.fetchCompetitionOrganizerEmails()])
      .then(([regs, comps]) => {
        setRegistrations(regs)
        setCompetitions(comps)
      })
      .catch((err) => setError(errorMessage(err, 'Failed to load competitions.')))
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  async function handleSaveEmail(competitionId: string) {
    setSaving(true)
    try {
      await internalApi.updateOrganizerEmail(competitionId, draftEmail)
      setEditingId(null)
      load()
    } catch (err) {
      setError(errorMessage(err, "Couldn't save organizer email."))
    } finally {
      setSaving(false)
    }
  }

  if (error) return <p className="font-sans text-[0.8125rem] text-red-400">{error}</p>
  if (!registrations || !competitions) return <p className="font-sans text-[0.8125rem] text-[#F0F0F0]/50">Loading…</p>

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="font-sans text-[0.8125rem] font-semibold text-[#F0F0F0] mb-3">Organizer emails</h2>
        <p className="font-sans text-[0.75rem] text-[#F0F0F0]/45 mb-3 leading-snug">
          Set per-competition — the notify-competition-registration function only sends an email when this is filled
          in and RESEND_API_KEY is configured.
        </p>
        <div className="border border-[#F0F0F0]/10 rounded-lg divide-y divide-[#F0F0F0]/6">
          {competitions.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="font-sans text-[0.8125rem] text-[#F0F0F0] min-w-0 truncate">{c.name}</span>
              {editingId === c.id ? (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <input
                    type="email"
                    value={draftEmail}
                    onChange={(e) => setDraftEmail(e.target.value)}
                    placeholder="organizer@example.com"
                    className="bg-[#F0F0F0]/[0.05] border border-[#F0F0F0]/15 rounded px-2.5 py-1.5 font-sans text-[0.75rem] text-[#F0F0F0] placeholder:text-[#F0F0F0]/30 focus:outline-none focus:border-[#F0F0F0]/40 w-[220px]"
                  />
                  <button
                    onClick={() => void handleSaveEmail(c.id)}
                    disabled={saving}
                    className="font-sans text-[0.75rem] font-medium text-[#1D1C1C] bg-[#F0F0F0] rounded px-2.5 py-1.5 hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="font-sans text-[0.75rem] text-[#F0F0F0]/50 hover:text-[#F0F0F0]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditingId(c.id)
                    setDraftEmail(c.organizerEmail ?? '')
                  }}
                  className="font-sans text-[0.75rem] text-[#F0F0F0]/70 hover:text-[#F0F0F0] flex-shrink-0"
                >
                  {c.organizerEmail ?? <span className="text-[#F0F0F0]/35">not set — click to add</span>}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-sans text-[0.8125rem] font-semibold text-[#F0F0F0] mb-3">
          Registrations ({registrations.length})
        </h2>
        <div className="border border-[#F0F0F0]/10 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#F0F0F0]/10">
                <th className="font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 px-4 py-2.5">
                  Competition
                </th>
                <th className="font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 px-4 py-2.5">Name</th>
                <th className="font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 px-4 py-2.5">Email</th>
                <th className="font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 px-4 py-2.5">
                  Team / School
                </th>
                <th className="font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 px-4 py-2.5">
                  Registered
                </th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => (
                <tr key={r.id} className="border-b border-[#F0F0F0]/6 last:border-0">
                  <td className="font-sans text-[0.8125rem] text-[#F0F0F0] px-4 py-2.5">{r.competitionName}</td>
                  <td className="font-sans text-[0.8125rem] text-[#F0F0F0]/80 px-4 py-2.5">{r.name}</td>
                  <td className="font-sans text-[0.8125rem] text-[#F0F0F0]/80 px-4 py-2.5">{r.email}</td>
                  <td className="font-sans text-[0.8125rem] text-[#F0F0F0]/80 px-4 py-2.5">{r.teamSchool}</td>
                  <td className="font-sans text-[0.75rem] text-[#F0F0F0]/45 px-4 py-2.5 whitespace-nowrap">
                    {formatDate(r.createdAt)}
                  </td>
                </tr>
              ))}
              {registrations.length === 0 && (
                <tr>
                  <td colSpan={5} className="font-sans text-[0.8125rem] text-[#F0F0F0]/40 px-4 py-6 text-center">
                    No registrations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
