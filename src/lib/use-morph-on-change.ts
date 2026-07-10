import * as React from 'react'

// True for `durationMs` right after `value` changes from what it was on the
// previous render — lets a state transition (Connect → Requested →
// Connected) get a brief pop instead of animating on mount or on unrelated
// re-renders. Only fires on a real change, so it never plays for state that
// didn't actually move.
export function useMorphOnChange<T>(value: T, durationMs = 200): boolean {
  const prev = React.useRef(value)
  const [morphing, setMorphing] = React.useState(false)

  React.useEffect(() => {
    if (prev.current === value) return
    prev.current = value
    setMorphing(true)
    const t = window.setTimeout(() => setMorphing(false), durationMs)
    return () => window.clearTimeout(t)
  }, [value, durationMs])

  return morphing
}
