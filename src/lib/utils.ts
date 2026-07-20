import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Supabase/PostgREST rejections are plain objects ({message, code, details,
// hint}), not `instanceof Error` — a bare `err instanceof Error` check
// silently discards the real reason and falls back to a generic string.
// This checks for Error first, then for anything with a usable string
// `.message` (covers Postgrest/Supabase errors), before giving up.
export function errorDetail(err: unknown): string | null {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message
  }
  return null
}

export function errorMessage(err: unknown, fallback: string): string {
  return errorDetail(err) ?? fallback
}
