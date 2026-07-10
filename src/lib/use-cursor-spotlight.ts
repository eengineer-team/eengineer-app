import { useEffect, useRef } from 'react'

// Cursor-reactive spotlight for the graph-paper hero (Variant A: calm default
// grid, a bolder copy of the same grid revealed in a soft radius under the
// pointer). Writes --mx/--my (pixels, relative to the host's box) which the
// `.bg-graph-paper::after` mask reads. Cheap by design: only a CSS-variable
// update per animation frame — the mask center moves on the compositor, no
// re-render, no per-line DOM.
//
// Guarded: does nothing on touch/coarse pointers (no hover to reveal with) or
// when the user asked for reduced motion. Attach the returned ref to the
// element carrying `.bg-graph-paper`.
export function useCursorSpotlight<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    let raf = 0
    let cx = 0
    let cy = 0

    const apply = () => {
      raf = 0
      const rect = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${cx - rect.left}px`)
      el.style.setProperty('--my', `${cy - rect.top}px`)
    }

    const onMove = (e: PointerEvent) => {
      cx = e.clientX
      cy = e.clientY
      if (!raf) raf = requestAnimationFrame(apply)
    }

    // Park the spotlight off-screen when the pointer leaves so the bold layer
    // fully masks out instead of freezing at the last position.
    const onLeave = () => {
      if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
      el.style.setProperty('--mx', '-1000px')
      el.style.setProperty('--my', '-1000px')
    }

    el.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerleave', onLeave)

    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return ref
}
