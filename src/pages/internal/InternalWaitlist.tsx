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

export function InternalWaitlist() {
  const [rows, setRows] = React.useState<internalApi.WaitlistSignup[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    internalApi
      .fetchWaitlist()
      .then(setRows)
      .catch((err) => setError(errorMessage(err, 'Failed to load the waitlist.')))
  }, [])

  if (error) return <p className="font-sans text-[0.8125rem] text-red-400">{error}</p>
  if (!rows) return <p className="font-sans text-[0.8125rem] text-[#F0F0F0]/50">Loading…</p>

  return (
    <div>
      <p className="font-sans text-[0.8125rem] text-[#F0F0F0]/50 mb-4">{rows.length} signups</p>
      <div className="border border-[#F0F0F0]/10 rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#F0F0F0]/10">
              <th className="font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 px-4 py-2.5">Name</th>
              <th className="font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 px-4 py-2.5">Email</th>
              <th className="font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 px-4 py-2.5">
                Organization / School
              </th>
              <th className="font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 px-4 py-2.5">Signed up</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-[#F0F0F0]/6 last:border-0">
                <td className="font-sans text-[0.8125rem] text-[#F0F0F0] px-4 py-2.5">{r.name}</td>
                <td className="font-sans text-[0.8125rem] text-[#F0F0F0]/80 px-4 py-2.5">{r.email}</td>
                <td className="font-sans text-[0.8125rem] text-[#F0F0F0]/80 px-4 py-2.5">{r.organization}</td>
                <td className="font-sans text-[0.75rem] text-[#F0F0F0]/45 px-4 py-2.5 whitespace-nowrap">
                  {formatDate(r.createdAt)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="font-sans text-[0.8125rem] text-[#F0F0F0]/40 px-4 py-6 text-center">
                  No signups yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
