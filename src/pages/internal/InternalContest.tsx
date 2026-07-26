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

// Registrations exist independently of any `contests` row (see
// supabase/migrations/20260726160000_contest_registrations.sql) -- there's
// no contest live yet, so this is currently the only place these signups
// are visible at all. The Junior/Senior breakdown is deliberate: the
// founder wants a live registration count for the funding conversation
// with Yoshlar Ishlari Agentligi, not just a raw table.
export function InternalContest() {
  const [registrations, setRegistrations] = React.useState<internalApi.ContestRegistrationEntry[] | null>(null)
  const [inquiries, setInquiries] = React.useState<internalApi.ContestInquiryEntry[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    Promise.all([internalApi.fetchContestRegistrations(), internalApi.fetchContestInquiries()])
      .then(([regs, inq]) => {
        setRegistrations(regs)
        setInquiries(inq)
      })
      .catch((err) => setError(errorMessage(err, 'Failed to load contest data.')))
  }, [])

  if (error) return <p className="font-sans text-[0.8125rem] text-red-400">{error}</p>
  if (!registrations || !inquiries) return <p className="font-sans text-[0.8125rem] text-[#F0F0F0]/50">Loading…</p>

  const juniorCount = registrations.filter((r) => r.ageGroup === 'junior').length
  const seniorCount = registrations.filter((r) => r.ageGroup === 'senior').length

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="font-sans text-[0.8125rem] font-semibold text-[#F0F0F0] mb-3">
          Registrations ({registrations.length})
        </h2>
        <div className="flex items-center gap-4 mb-3">
          <span className="font-sans text-[0.75rem] text-[#F0F0F0]/60">Junior (12–15): {juniorCount}</span>
          <span className="font-sans text-[0.75rem] text-[#F0F0F0]/60">Senior (16–18): {seniorCount}</span>
        </div>
        <div className="border border-[#F0F0F0]/10 rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#F0F0F0]/10">
                <th className="font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 px-4 py-2.5">Name</th>
                <th className="font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 px-4 py-2.5">
                  Region
                </th>
                <th className="font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 px-4 py-2.5">
                  Bracket
                </th>
                <th className="font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 px-4 py-2.5">
                  Telegram
                </th>
                <th className="font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 px-4 py-2.5">
                  Guardian Telegram
                </th>
                <th className="font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 px-4 py-2.5">Email</th>
                <th className="font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 px-4 py-2.5">
                  Registered
                </th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => (
                <tr key={r.id} className="border-b border-[#F0F0F0]/6 last:border-0">
                  <td className="font-sans text-[0.8125rem] text-[#F0F0F0] px-4 py-2.5 whitespace-nowrap">{r.name}</td>
                  <td className="font-sans text-[0.8125rem] text-[#F0F0F0]/80 px-4 py-2.5 whitespace-nowrap">
                    {r.region}
                  </td>
                  <td className="font-sans text-[0.8125rem] text-[#F0F0F0]/80 px-4 py-2.5 capitalize">
                    {r.ageGroup}
                  </td>
                  <td className="font-sans text-[0.8125rem] text-[#F0F0F0]/80 px-4 py-2.5 whitespace-nowrap">
                    @{r.contactTelegram}
                  </td>
                  <td className="font-sans text-[0.8125rem] text-[#F0F0F0]/80 px-4 py-2.5 whitespace-nowrap">
                    {r.guardianTelegram ? `@${r.guardianTelegram}` : <span className="text-[#F0F0F0]/30">—</span>}
                  </td>
                  <td className="font-sans text-[0.8125rem] text-[#F0F0F0]/80 px-4 py-2.5">
                    {r.contactEmail ?? <span className="text-[#F0F0F0]/30">—</span>}
                  </td>
                  <td className="font-sans text-[0.75rem] text-[#F0F0F0]/45 px-4 py-2.5 whitespace-nowrap">
                    {formatDate(r.createdAt)}
                  </td>
                </tr>
              ))}
              {registrations.length === 0 && (
                <tr>
                  <td colSpan={7} className="font-sans text-[0.8125rem] text-[#F0F0F0]/40 px-4 py-6 text-center">
                    No registrations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-sans text-[0.8125rem] font-semibold text-[#F0F0F0] mb-3">
          Inquiries / complaints ({inquiries.length})
        </h2>
        <div className="border border-[#F0F0F0]/10 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#F0F0F0]/10">
                <th className="font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 px-4 py-2.5">Name</th>
                <th className="font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 px-4 py-2.5">
                  Contact
                </th>
                <th className="font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 px-4 py-2.5">
                  Message
                </th>
                <th className="font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 px-4 py-2.5">Sent</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((i) => (
                <tr key={i.id} className="border-b border-[#F0F0F0]/6 last:border-0">
                  <td className="font-sans text-[0.8125rem] text-[#F0F0F0] px-4 py-2.5 whitespace-nowrap">
                    {i.name ?? <span className="text-[#F0F0F0]/30">—</span>}
                  </td>
                  <td className="font-sans text-[0.8125rem] text-[#F0F0F0]/80 px-4 py-2.5 whitespace-nowrap">
                    {i.contact}
                  </td>
                  <td className="font-sans text-[0.8125rem] text-[#F0F0F0]/80 px-4 py-2.5">{i.message}</td>
                  <td className="font-sans text-[0.75rem] text-[#F0F0F0]/45 px-4 py-2.5 whitespace-nowrap">
                    {formatDate(i.createdAt)}
                  </td>
                </tr>
              ))}
              {inquiries.length === 0 && (
                <tr>
                  <td colSpan={4} className="font-sans text-[0.8125rem] text-[#F0F0F0]/40 px-4 py-6 text-center">
                    No inquiries yet.
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
