import * as React from 'react'

// Mirrors React.useState but mirrors the value to localStorage under `key`,
// so user-created state (profiles, projects, messages, RSVPs, ...) survives
// refresh instead of resetting to SEED_* every time. Same guard pattern as
// Settings.tsx's readStoredPrefs: SSR-safe, tolerant of missing/corrupt JSON.
export function usePersistentState<T>(key: string, initial: T | (() => T)) {
  const [state, setState] = React.useState<T>(() => {
    if (typeof window === 'undefined') return initial instanceof Function ? initial() : initial
    try {
      const raw = window.localStorage.getItem(key)
      if (!raw) return initial instanceof Function ? initial() : initial
      return JSON.parse(raw) as T
    } catch {
      return initial instanceof Function ? initial() : initial
    }
  })

  React.useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state))
    } catch {
      // ignore quota/serialization errors — falls back to in-memory only
    }
  }, [key, state])

  return [state, setState] as const
}
