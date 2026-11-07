// Supabase Edge Function (Deno): the eengineer Physics AI tutor.
//
// POST body: { problemId, partId, problemStatement, partPrompt, referenceSolution,
//              studentAnswer?, messages: [{ role: 'user' | 'assistant', content }] }
// 200: { reply, remainingToday }
// 4xx/5xx: { error: 'limit_reached' | 'unavailable' | 'bad_request' | 'unauthorized', remainingToday? }
//
// Secrets: ANTHROPIC_API_KEY (required), TUTOR_FREE_DAILY_LIMIT (default 5),
// TUTOR_GLOBAL_DAILY_LIMIT (default 80), TUTOR_ALLOWED_ORIGINS (optional, comma separated).
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are injected by Supabase.

import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { buildSystemPrompt, type ProblemContext } from './prompt.ts'

const MODEL = 'claude-opus-5-5'
const MAX_BODY_BYTES = 64 * 1024
const MAX = {
  id: 64,
  statement: 4000,
  partPrompt: 4000,
  referenceSolution: 4000,
  studentAnswer: 500,
  message: 2000,
  messages: 10,
}

// ---------------------------------------------------------------------------
// Config

function intEnv(name: string, fallback: number) {
  const n = Number.parseInt(Deno.env.get(name) ?? '', 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

const USER_DAILY_LIMIT = intEnv('TUTOR_FREE_DAILY_LIMIT', 5)
const GLOBAL_DAILY_LIMIT = intEnv('TUTOR_GLOBAL_DAILY_LIMIT', 80)
const ALLOWED_ORIGINS = (Deno.env.get('TUTOR_ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } }
const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, clientOptions)
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, clientOptions)

// Created lazily so a missing key turns into a clean 'unavailable' response instead of a boot crash.
let anthropic: Anthropic | null = null
function getAnthropic(): Anthropic | null {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) return null
  anthropic ??= new Anthropic({ apiKey, maxRetries: 1, timeout: 60_000 })
  return anthropic
}

// ---------------------------------------------------------------------------
// HTTP helpers

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? ''
  // Bearer-token auth (no cookies), so "*" is safe; TUTOR_ALLOWED_ORIGINS narrows it in production.
  const allow = ALLOWED_ORIGINS.length === 0 ? '*' : ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function json(req: Request, status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

// ---------------------------------------------------------------------------
// Validation

type Turn = { role: 'user' | 'assistant'; content: string }
type TutorRequest = ProblemContext & { messages: Turn[] }

const ID_PATTERN = /^[A-Za-z0-9_-]+$/

function str(value: unknown, max: number, { required = true } = {}): string | null | undefined {
  if (value === undefined || value === null || value === '') return required ? null : undefined
  if (typeof value !== 'string') return null
  const s = value.trim()
  if (s.length > max || (required && s.length === 0)) return null
  return s
}

/** Returns the parsed request, or null if anything is missing, too long or malformed. */
function parseRequest(raw: unknown): TutorRequest | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const b = raw as Record<string, unknown>

  const problemId = str(b.problemId, MAX.id)
  const partId = str(b.partId, MAX.id)
  const problemStatement = str(b.problemStatement, MAX.statement)
  const partPrompt = str(b.partPrompt, MAX.partPrompt)
  const referenceSolution = str(b.referenceSolution, MAX.referenceSolution)
  const studentAnswer = str(b.studentAnswer, MAX.studentAnswer, { required: false })
  if (!problemId || !partId || !problemStatement || !partPrompt || !referenceSolution || studentAnswer === null) return null
  if (!ID_PATTERN.test(problemId) || !ID_PATTERN.test(partId)) return null

  if (!Array.isArray(b.messages) || b.messages.length === 0 || b.messages.length > MAX.messages) return null
  const messages: Turn[] = []
  for (let i = 0; i < b.messages.length; i++) {
    const m = b.messages[i] as Record<string, unknown> | null
    if (!m || typeof m !== 'object') return null
    // Turns must alternate starting with the user, so the role is fixed by position.
    const expected = i % 2 === 0 ? 'user' : 'assistant'
    if (m.role !== expected) return null
    const content = str(m.content, MAX.message)
    if (!content) return null
    messages.push({ role: expected, content })
  }
  if (messages[messages.length - 1].role !== 'user') return null

  return { problemId, partId, problemStatement, partPrompt, referenceSolution, studentAnswer, messages }
}

// ---------------------------------------------------------------------------
// Rate limiting (see supabase/migrations/*_tutor_usage.sql)

/** Counts one question. Returns remaining questions today, -1 if over a limit, or null on a database error. */
async function consume(userId: string): Promise<number | null> {
  const { data, error } = await adminClient.rpc('tutor_consume', {
    p_user: userId,
    p_user_limit: USER_DAILY_LIMIT,
    p_global_limit: GLOBAL_DAILY_LIMIT,
  })
  if (error || typeof data !== 'number') {
    console.error('tutor_consume failed', error?.code ?? 'unexpected result')
    return null
  }
  return data
}

/** Gives a question back when the upstream call failed through no fault of the student. */
async function release(userId: string) {
  const { error } = await adminClient.rpc('tutor_release', { p_user: userId })
  if (error) console.error('tutor_release failed', error.code)
}

// ---------------------------------------------------------------------------
// Claude

type AskResult = { reply: string } | { failure: 'refusal' | 'empty' | 'upstream' }

async function askClaude(client: Anthropic, req: TutorRequest): Promise<AskResult> {
  // Narrow cast: older SDK typings may not know `fallbacks: 'default'` or every `output_config`
  // field yet. The request shape is what the API expects; keep it as written.
  const params = {
    model: MODEL,
    max_tokens: 4000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium' },
    betas: ['server-side-fallback-2026-07-01'],
    // On a safety-classifier decline the API retries on Anthropic's recommended fallback model.
    fallbacks: 'default',
    system: buildSystemPrompt(req),
    messages: req.messages,
  } as unknown as Anthropic.Beta.Messages.MessageCreateParamsNonStreaming

  try {
    const response = await client.beta.messages.create(params)

    if (response.stop_reason === 'refusal') return { failure: 'refusal' }

    const reply = response.content
      .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim()
    return reply ? { reply } : { failure: 'empty' }
  } catch (err) {
    // Log only the class and status: never the request, the key or the provider's message body.
    if (err instanceof Anthropic.RateLimitError) {
      console.error('Anthropic rate limit', err.status)
    } else if (err instanceof Anthropic.APIError) {
      console.error('Anthropic API error', err.name, err.status ?? 'no status')
    } else {
      console.error('Unexpected tutor error', err instanceof Error ? err.name : typeof err)
    }
    return { failure: 'upstream' }
  }
}

// ---------------------------------------------------------------------------
// Handler

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(req) })
  if (req.method !== 'POST') return json(req, 405, { error: 'bad_request' })

  // verify_jwt already rejects unsigned requests at the gateway; we still resolve the user
  // ourselves because the rate limit is keyed on their id.
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : ''
  if (!token) return json(req, 401, { error: 'unauthorized' })
  const { data: userData, error: userError } = await authClient.auth.getUser(token)
  const userId = userData?.user?.id
  if (userError || !userId) return json(req, 401, { error: 'unauthorized' })

  const declaredLength = Number(req.headers.get('Content-Length') ?? '0')
  if (declaredLength > MAX_BODY_BYTES) return json(req, 413, { error: 'bad_request' })
  let raw: unknown
  try {
    const text = await req.text()
    if (text.length > MAX_BODY_BYTES) return json(req, 413, { error: 'bad_request' })
    raw = JSON.parse(text)
  } catch {
    return json(req, 400, { error: 'bad_request' })
  }
  const body = parseRequest(raw)
  if (!body) return json(req, 400, { error: 'bad_request' })

  // Check configuration before spending one of the student's questions.
  const client = getAnthropic()
  if (!client) {
    console.error('ANTHROPIC_API_KEY is not set')
    return json(req, 503, { error: 'unavailable' })
  }

  const remaining = await consume(userId)
  if (remaining === null) return json(req, 503, { error: 'unavailable' })
  if (remaining < 0) return json(req, 429, { error: 'limit_reached', remainingToday: 0 })

  const result = await askClaude(client, body)
  if ('reply' in result) return json(req, 200, { reply: result.reply, remainingToday: remaining })

  // Refusals and empty replies still cost tokens, so only transport/API failures are refunded.
  if (result.failure === 'upstream') {
    await release(userId)
    return json(req, 503, { error: 'unavailable', remainingToday: remaining + 1 })
  }
  return json(req, 503, { error: 'unavailable', remainingToday: remaining })
})
