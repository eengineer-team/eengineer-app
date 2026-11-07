import { ensureSession, supabase } from '@/lib/supabase'
import type { Problem, ProblemPart } from '@/types/problem'

// Client side of the `tutor` Edge Function (supabase/functions/tutor/index.ts).
// The limits mirror the server's validation so a long problem is trimmed here
// instead of being rejected there.
export const LIMITS = {
  statement: 4000,
  partPrompt: 4000,
  referenceSolution: 4000,
  studentAnswer: 500,
  message: 2000,
  messages: 10,
} as const

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export type TutorResult =
  | { ok: true; reply: string; remainingToday: number | null }
  | { ok: false; reason: 'offline' | 'session' | 'limit_reached' | 'unavailable' | 'bad_request' | 'network'; remainingToday?: number }

type ServerResponse = { reply?: unknown; remainingToday?: unknown; error?: unknown }

function clip(text: string, max: number) {
  return text.length <= max ? text : text.slice(0, max - 1) + '…'
}

const LETTERS = 'ABCDEFGHIJ'

/** The part prompt, plus lettered options for multiple-choice parts so the tutor can refer to them. */
export function formatPartPrompt(part: ProblemPart) {
  if (part.answer.kind !== 'choice') return part.prompt
  const options = part.answer.options.map((o, i) => `(${LETTERS[i] ?? i + 1}) ${o}`).join('\n')
  return `${part.prompt}\n\nOptions:\n${options}`
}

/** Worked solution steps followed by the correct answer: the tutor's ground truth. */
export function formatReferenceSolution(part: ProblemPart) {
  const steps = part.solution.map((s, i) => `${i + 1}. ${s.title}: ${s.body}`).join('\n')
  const a = part.answer
  const answer =
    a.kind === 'numeric'
      ? `${a.value}${a.unit ? ` ${a.unit}` : ''} (answers within ±${a.tolerancePct}% are accepted)`
      : `(${LETTERS[a.correctIndex] ?? a.correctIndex + 1}) ${a.options[a.correctIndex] ?? ''}`
  return `${steps}\n\nCorrect answer: ${answer}`
}

/**
 * The most recent turns, trimmed to the server's limits. The server requires the
 * thread to start with a user turn, alternate, and end with a user turn.
 */
export function recentTurns(messages: ChatMessage[]): ChatMessage[] {
  const recent = messages.slice(-LIMITS.messages).map((m) => ({ role: m.role, content: clip(m.content.trim(), LIMITS.message) }))
  while (recent.length > 0 && recent[0].role !== 'user') recent.shift()
  return recent
}

function remainingFrom(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : undefined
}

function fromServer(payload: ServerResponse | null): TutorResult {
  if (payload && typeof payload.reply === 'string' && payload.reply.trim()) {
    return { ok: true, reply: payload.reply.trim(), remainingToday: remainingFrom(payload.remainingToday) ?? null }
  }
  const remainingToday = remainingFrom(payload?.remainingToday)
  switch (payload?.error) {
    case 'limit_reached':
      return { ok: false, reason: 'limit_reached', remainingToday: remainingToday ?? 0 }
    case 'bad_request':
      return { ok: false, reason: 'bad_request', remainingToday }
    default:
      return { ok: false, reason: 'unavailable', remainingToday }
  }
}

export async function askTutor(args: {
  problem: Problem
  part: ProblemPart
  studentAnswer?: string
  messages: ChatMessage[]
}): Promise<TutorResult> {
  if (!supabase) return { ok: false, reason: 'offline' }
  if (!(await ensureSession())) return { ok: false, reason: 'session' }

  const body = {
    problemId: args.problem.id,
    partId: args.part.id,
    problemStatement: clip(args.problem.statement, LIMITS.statement),
    partPrompt: clip(formatPartPrompt(args.part), LIMITS.partPrompt),
    referenceSolution: clip(formatReferenceSolution(args.part), LIMITS.referenceSolution),
    studentAnswer: args.studentAnswer?.trim() ? clip(args.studentAnswer.trim(), LIMITS.studentAnswer) : undefined,
    messages: recentTurns(args.messages),
  }

  try {
    const { data, error } = await supabase.functions.invoke<ServerResponse>('tutor', { body })
    if (!error) return fromServer(data)
    // Non-2xx responses still carry our JSON error body; FunctionsHttpError exposes the Response as `context`.
    const ctx: unknown = (error as { context?: unknown }).context
    if (ctx instanceof Response) {
      const payload = (await ctx.json().catch(() => null)) as ServerResponse | null
      return fromServer(payload)
    }
    return { ok: false, reason: 'network' }
  } catch {
    return { ok: false, reason: 'network' }
  }
}
