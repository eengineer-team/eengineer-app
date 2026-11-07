import type { ChoiceAnswer, NumericAnswer } from '@/types/problem'

// Pure answer parsing/checking. No React, no DOM, so it is easy to test in isolation.

export interface ParsedNumber {
  value: number
  /** Whatever followed the number, trimmed (e.g. "m/s"). Empty when no unit was typed. */
  unit: string
}

export type CheckStatus = 'empty' | 'invalid' | 'correct' | 'incorrect'

export interface NumericCheck {
  status: CheckStatus
  parsed?: ParsedNumber
  /** True when the student typed a unit that does not look like the expected one. */
  unitMismatch: boolean
}

const SUPERSCRIPTS: Record<string, string> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
  '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  '⁺': '+', '⁻': '-',
}

function fromSuperscript(s: string): string {
  return [...s].map((c) => SUPERSCRIPTS[c] ?? c).join('')
}

// mantissa, then optional exponent ("e3", "E-3", "×10^3", "x 10^(-3)", "*10³"), then the rest.
const NUMBER_RE =
  /^([+-]?(?:\d+(?:\.\d*)?|\.\d+))(?:\s*(?:[eE]([+-]?\d+)|(?:[x×*·]|\\times)\s*10\s*(?:(?:\^|\*\*)\s*\(?\s*([+-]?\d+)\s*\)?|([⁺⁻]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+))))?\s*(.*)$/u

// A unit must start like a unit: a letter, µ, Ω, °, or %.
const UNIT_START_RE = /^[\p{L}µΩ°%]/u

/**
 * Parse what a student typed into a number, stripping a trailing unit.
 * Accepts "12.4", "-3", "1.2e3", "1.2×10^3", "1.2 x 10^-3", "4.5×10⁻³", "12.4 m/s", "1,200", "3/4".
 * Returns null when the text is not a number.
 */
export function parseNumericInput(raw: string): ParsedNumber | null {
  let s = raw
    .trim()
    .replace(/[−–—]/g, '-') // Unicode minus and dashes typed on phones
    .replace(/^[=≈~]\s*/, '') // "= 12.4" or "≈ 12"
    .replace(/^\+\s*/, '+')
    .replace(/^-\s+/, '-')
  if (!s) return null

  // Thousands separators ("1,200" or "12,345.6"); a lone comma is a decimal comma ("12,4").
  if (/^[+-]?\d{1,3}(,\d{3})+(\.\d+)?(?!\d)/.test(s)) {
    s = s.replace(/^([+-]?[\d,]+)/, (m) => m.replace(/,/g, ''))
  } else {
    s = s.replace(/^([+-]?\d+),(\d+)/, '$1.$2')
  }

  const m = NUMBER_RE.exec(s)
  if (!m) return null
  const [, mantissa, eExp, caretExp, superExp, rest] = m
  let value = Number(mantissa)
  const exponent = eExp ?? caretExp ?? (superExp ? fromSuperscript(superExp) : undefined)
  if (exponent !== undefined) value *= 10 ** Number(exponent)

  let unit = rest.trim()
  // Simple fraction "3/4" or "-1/2": the denominator must be a plain number.
  const frac = exponent === undefined ? /^\/\s*(\d+(?:\.\d*)?|\.\d+)\s*(.*)$/u.exec(unit) : null
  if (frac) {
    const den = Number(frac[1])
    if (den === 0) return null
    value /= den
    unit = frac[2].trim()
  }

  if (unit && !UNIT_START_RE.test(unit)) return null
  if (!Number.isFinite(value)) return null
  return { value, unit }
}

/** Normalise a unit for a loose comparison: "m/s^2" == "m/s²", "N m" == "N·m". */
export function normalizeUnit(u: string): string {
  return u
    .trim()
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, '·')
    .replace(/[*.]/g, '·')
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/\^-1/g, '⁻¹')
    .replace(/^·+|·+$/g, '')
    .replace(/μ/g, 'µ') // Greek mu vs micro sign
    .replace(/^(?:deg|degs|degrees?)$/i, '°')
}

/** |given - value| <= |value| * tolerancePct / 100, with a hair of slack for floating point. */
export function withinTolerance(given: number, expected: number, tolerancePct: number): boolean {
  const allowed = (Math.abs(expected) * Math.max(0, tolerancePct)) / 100
  // Relative slack only: an absolute term would swamp tiny SI values like G = 6.67e-11.
  const slack = 1e-9 * Math.abs(expected)
  return Math.abs(given - expected) <= allowed + slack
}

export function checkNumeric(raw: string, answer: NumericAnswer): NumericCheck {
  if (!raw.trim()) return { status: 'empty', unitMismatch: false }
  const parsed = parseNumericInput(raw)
  if (!parsed) return { status: 'invalid', unitMismatch: false }
  const unitMismatch = parsed.unit !== '' && normalizeUnit(parsed.unit) !== normalizeUnit(answer.unit)
  const status = withinTolerance(parsed.value, answer.value, answer.tolerancePct) ? 'correct' : 'incorrect'
  return { status, parsed, unitMismatch }
}

export function checkChoice(selected: number | null, answer: ChoiceAnswer): CheckStatus {
  if (selected === null) return 'empty'
  return selected === answer.correctIndex ? 'correct' : 'incorrect'
}

const SUP_DIGITS = '⁰¹²³⁴⁵⁶⁷⁸⁹'
function toSuperscript(n: number): string {
  return String(n)
    .replace('-', '⁻')
    .replace(/\d/g, (d) => SUP_DIGITS[Number(d)])
}

/** Human-friendly number: 4 significant figures, scientific notation (×10ⁿ) outside 0.001 to 100000. */
export function formatNumber(v: number): string {
  if (v === 0 || !Number.isFinite(v)) return String(v === 0 ? 0 : v)
  const abs = Math.abs(v)
  if (abs >= 1e5 || abs < 1e-3) {
    const [mant, exp] = v.toExponential(3).split('e')
    return `${String(Number(mant))}×10${toSuperscript(Number(exp))}`
  }
  return String(Number(v.toPrecision(4)))
}
