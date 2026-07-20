import * as React from 'react'
import { useLocation } from 'react-router-dom'

// Wraps only the routed page content (<Outlet/> in Dashboard.tsx), never the
// Sidebar/DashboardHeader around it — a crash in one screen (the webinars[0]
// crash that took out the entire dashboard was exactly this class of bug)
// should leave navigation usable so the person can click away from the
// broken page, not stare at an all-black screen with no way out.
//
// React error boundaries must be class components (no hook equivalent), so
// the reset-on-navigate behavior is done via a small functional wrapper below
// that feeds the current pathname in as `resetKey` — the class component
// clears its caught error whenever that key changes.

interface Props {
  children: React.ReactNode
  resetKey: string
}

interface State {
  error: Error | null
}

class ErrorBoundaryInner extends React.Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // This codebase has repeatedly hidden real errors behind a bare
    // console.error(err) that prints "Object" for non-Error rejections and
    // gives no stack — that pattern cost real debugging time more than once.
    // A caught render error always IS an Error with a stack, so log it in full.
    console.error('Dashboard page crashed:', error, info.componentStack)
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex-1 w-full max-w-[560px] mx-auto flex flex-col items-center justify-center gap-4 px-4 py-16 text-center">
          <p className="font-display text-lg font-semibold text-dark-text">
            This page hit a snag.
          </p>
          <p className="font-sans text-[0.8125rem] text-dark-muted leading-relaxed">
            Something on this screen crashed instead of loading. The rest of the dashboard is fine
            — use the sidebar to go somewhere else, or reload to try this page again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="font-sans text-[0.8125rem] font-semibold tracking-[0.05em] uppercase text-dark-text border border-white/15 rounded px-4 py-2 hover:bg-white/5 transition-colors"
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export function DashboardErrorBoundary({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  return <ErrorBoundaryInner resetKey={location.pathname}>{children}</ErrorBoundaryInner>
}
