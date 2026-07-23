import * as React from 'react'
import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import * as internalApi from '@/lib/api/internal'
import { cn } from '@/lib/utils'

type GuardState = 'loading' | 'signed-out' | 'not-admin' | 'admin'

const TABS = [
  { to: '/internal/waitlist', label: 'Waitlist' },
  { to: '/internal/feedback', label: 'Feedback' },
  { to: '/internal/competitions', label: 'Competitions' },
]

// Real authorization happens in Postgres (app.is_internal_admin(), see
// supabase/migrations/20260723120000_internal_admins.sql) -- every query in
// api/internal.ts already comes back empty for a non-admin session. This
// guard is just so a signed-in-but-not-allowlisted account sees an honest
// "not authorized" screen instead of a panel full of empty tables.
export function InternalLayout() {
  const [state, setState] = React.useState<GuardState>('loading')

  const check = React.useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      setState('signed-out')
      return
    }
    try {
      const isAdmin = await internalApi.amIInternalAdmin()
      setState(isAdmin ? 'admin' : 'not-admin')
    } catch {
      setState('not-admin')
    }
  }, [])

  React.useEffect(() => {
    void check()
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => void check(), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [check])

  if (state === 'loading') {
    return <div className="min-h-screen bg-[#1D1C1C]" />
  }

  if (state === 'signed-out') {
    return <Navigate to="/internal/login" replace />
  }

  if (state === 'not-admin') {
    return (
      <div className="min-h-screen bg-[#1D1C1C] flex items-center justify-center px-4">
        <div className="text-center max-w-[360px]">
          <p className="font-sans text-[0.875rem] text-[#F0F0F0] mb-2">Not authorized.</p>
          <p className="font-sans text-[0.8125rem] text-[#F0F0F0]/60 leading-snug mb-4">
            This account isn't on the internal admin allowlist.
          </p>
          <button
            onClick={() => void internalApi.internalSignOut()}
            className="font-sans text-[0.8125rem] text-[#F0F0F0] underline underline-offset-2 hover:no-underline"
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1D1C1C]">
      <header className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-[#F0F0F0]/10">
        <p className="font-sans text-[13px] tracking-[0.08em] uppercase text-[#F0F0F0]/50">
          eengineer / internal
        </p>
        <button
          onClick={() => void internalApi.internalSignOut()}
          className="font-sans text-[0.8125rem] text-[#F0F0F0]/60 hover:text-[#F0F0F0] transition-colors"
        >
          Sign out
        </button>
      </header>

      <div className="px-6 sm:px-10 py-8 max-w-[1100px] mx-auto">
        <div className="flex items-center gap-1 border-b border-[#F0F0F0]/10 mb-6">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  'px-4 py-2.5 font-sans text-[0.8125rem] font-medium border-b-2 -mb-px transition-colors duration-150',
                  isActive
                    ? 'text-[#F0F0F0] border-[#F0F0F0]'
                    : 'text-[#F0F0F0]/45 border-transparent hover:text-[#F0F0F0]/80'
                )
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>

        <Outlet />
      </div>
    </div>
  )
}
