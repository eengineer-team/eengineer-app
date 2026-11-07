import { useSyncExternalStore } from 'react'
import type { Problem } from '@/types/problem'

// Solved parts are stored as "problemId:partId" strings under one localStorage key.
// Every storage access is guarded: in private mode or with storage blocked, progress
// still works for the current session through the in-memory copy.

const STORAGE_KEY = 'eengineer-physics:progress:v1'

let solved: ReadonlySet<string> | null = null
const listeners = new Set<() => void>()

export function partKey(problemId: string, partId: string) {
  return `${problemId}:${partId}`
}

function readStorage(): ReadonlySet<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const data: unknown = JSON.parse(raw)
    const list = (data as { solved?: unknown })?.solved
    return new Set(Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [])
  } catch {
    return new Set()
  }
}

function writeStorage(set: ReadonlySet<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ solved: [...set] }))
  } catch {
    /* storage unavailable or full: keep the in-memory copy */
  }
}

function getSnapshot(): ReadonlySet<string> {
  if (!solved) solved = readStorage()
  return solved
}

const EMPTY: ReadonlySet<string> = new Set()
const getServerSnapshot = () => EMPTY

function emit() {
  listeners.forEach((l) => l())
}

function onStorage(e: StorageEvent) {
  if (e.key === STORAGE_KEY || e.key === null) {
    solved = readStorage()
    emit()
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    try {
      window.addEventListener('storage', onStorage)
    } catch {
      /* no window */
    }
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      try {
        window.removeEventListener('storage', onStorage)
      } catch {
        /* no window */
      }
    }
  }
}

export function markPartSolved(problemId: string, partId: string) {
  const current = getSnapshot()
  const key = partKey(problemId, partId)
  if (current.has(key)) return
  const next = new Set(current)
  next.add(key)
  solved = next
  writeStorage(next)
  emit()
}

/** Live set of solved part keys; re-renders when progress changes (also from other tabs). */
export function useSolvedParts(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function solvedPartCount(problem: Problem, set: ReadonlySet<string>) {
  return problem.parts.filter((p) => set.has(partKey(problem.id, p.id))).length
}

/** A problem counts as solved when every part has been answered correctly. */
export function isProblemSolved(problem: Problem, set: ReadonlySet<string>) {
  return problem.parts.length > 0 && solvedPartCount(problem, set) === problem.parts.length
}
