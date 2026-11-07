import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

/** Tracks an element's content width so SVGs can draw at real pixel size (readable text on phones). */
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(Math.floor(el.clientWidth))
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w !== undefined) setWidth(Math.floor(w))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

export type Speed = 0.25 | 0.5 | 1

/** Simulation clock driven by requestAnimationFrame. Time stops (and playback pauses) at `duration`. */
export function usePlayback(duration: number) {
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(() => !prefersReducedMotion())
  const [speed, setSpeed] = useState<Speed>(1)
  const tRef = useRef(0)

  const seek = useCallback((value: number) => {
    tRef.current = value
    setT(value)
  }, [])

  useEffect(() => {
    if (!playing) return
    if (duration <= 0) {
      setPlaying(false)
      return
    }
    let raf = 0
    let last: number | null = null
    const step = (now: number) => {
      // Cap the frame delta so a backgrounded tab doesn't jump to the end on return.
      const dt = last === null ? 0 : Math.min((now - last) / 1000, 0.1)
      last = now
      const next = tRef.current + dt * speed
      if (next >= duration) {
        seek(duration)
        setPlaying(false)
        return
      }
      seek(next)
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [playing, speed, duration, seek])

  // Parameters changed and the run got shorter: keep the clock inside it.
  useEffect(() => {
    if (tRef.current > duration) seek(Math.max(0, duration))
  }, [duration, seek])

  const play = useCallback(() => {
    if (tRef.current >= duration - 1e-9) seek(0)
    setPlaying(true)
  }, [duration, seek])

  const pause = useCallback(() => setPlaying(false), [])

  /** Back to t = 0; autoplay unless the user prefers reduced motion. */
  const reset = useCallback(
    (autoplay = false) => {
      seek(0)
      setPlaying(autoplay && !prefersReducedMotion())
    },
    [seek],
  )

  return { t: Math.min(t, Math.max(0, duration)), playing, speed, setSpeed, play, pause, seek, reset }
}
