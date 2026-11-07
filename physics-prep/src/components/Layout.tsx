import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Container, cx } from '@/components/ui'

const NAV = [
  { to: '/practice', label: 'Practice' },
  { to: '/tools', label: 'Tools' },
  { to: '/pro', label: 'Pro' },
]

/** In-app pages get eengineer's dark dashboard identity; everything else is the cornsilk welcome identity. */
function identityFor(pathname: string): 'welcome' | 'dashboard' {
  return pathname.startsWith('/practice') || pathname.startsWith('/tools') ? 'dashboard' : 'welcome'
}

export function Layout() {
  const { pathname } = useLocation()
  const identity = identityFor(pathname)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  // Apply the identity to <html> too, so overscroll and native controls match the page.
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('theme-welcome', 'theme-dashboard')
    root.classList.add(`theme-${identity}`)
    root.style.colorScheme = identity === 'dashboard' ? 'dark' : 'light'
  }, [identity])

  return (
    <div
      className={cx(
        `theme-${identity}`,
        'flex min-h-screen flex-col text-text',
        identity === 'dashboard' ? 'bg-dark-radial' : 'bg-graph-paper',
      )}
    >
      <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur">
        <Container className="flex h-14 items-center justify-between gap-2">
          {/* Below 400px the wordmark shortens to eengineer's "ee" mark so the nav still fits a 320px phone. */}
          <NavLink to="/" aria-label="eengineer physics, home" className="shrink-0 font-display text-base font-bold tracking-tight sm:text-lg">
            <span className="min-[400px]:hidden">ee</span>
            <span className="hidden min-[400px]:inline">eengineer</span>
            <span className="text-accent">.physics</span>
          </NavLink>
          <nav className="flex min-w-0 items-center sm:gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  cx(
                    'rounded px-2 py-1.5 text-sm font-medium transition-colors sm:px-3',
                    isActive ? 'bg-surface2 text-text' : 'text-muted hover:text-text',
                  )
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </Container>
      </header>
      <main className="flex-1 py-10">
        <Outlet />
      </main>
      <footer className="border-t border-border py-6 text-sm text-muted">
        <Container className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <span>© eengineer.net · original practice material</span>
          <span>
            AP® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this site.
          </span>
        </Container>
      </footer>
    </div>
  )
}
