import * as React from 'react'

// Founder request: zoom should be strictly off everywhere, not just "pinch
// on mobile" (the viewport meta tag alone only covers that). This closes
// the other three ways a browser lets someone zoom a page:
//   1. ctrl/cmd + mouse wheel (desktop trackpad pinch fires as this too)
//   2. ctrl/cmd + '+' / '-' / '0' (keyboard zoom)
//   3. double-tap on a touchscreen
// None of these can be blocked via CSS/meta alone, so this is a real event
// listener, mounted once at the app root (see App.tsx).
export function useDisableZoom() {
  React.useEffect(() => {
    const blockWheelZoom = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault()
    }

    const blockKeyboardZoom = (e: KeyboardEvent) => {
      const isZoomKey = e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0'
      if ((e.ctrlKey || e.metaKey) && isZoomKey) e.preventDefault()
    }

    let lastTouchEnd = 0
    const blockDoubleTapZoom = (e: TouchEvent) => {
      const now = Date.now()
      if (now - lastTouchEnd <= 300) e.preventDefault()
      lastTouchEnd = now
    }

    document.addEventListener('wheel', blockWheelZoom, { passive: false })
    document.addEventListener('keydown', blockKeyboardZoom)
    document.addEventListener('touchend', blockDoubleTapZoom, { passive: false })

    return () => {
      document.removeEventListener('wheel', blockWheelZoom)
      document.removeEventListener('keydown', blockKeyboardZoom)
      document.removeEventListener('touchend', blockDoubleTapZoom)
    }
  }, [])
}
