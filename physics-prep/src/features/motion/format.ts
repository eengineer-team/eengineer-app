// Number formatting and axis-tick helpers shared by the scenes, graphs and readouts.

const MINUS = '−'

/** Fixed decimals with a real minus sign; tiny values print as 0 (no "−0.00"). */
export function fmtFixed(v: number, digits = 2): string {
  if (!Number.isFinite(v)) return '—'
  const r = Math.abs(v) < 0.5 * 10 ** -digits ? 0 : v
  return r.toFixed(digits).replace('-', MINUS)
}

/** Three significant figures, for results such as "40.8 m" or "0.0123 s". */
export function fmtSig(v: number): string {
  if (!Number.isFinite(v)) return '—'
  if (Math.abs(v) < 1e-9) return '0'
  if (Math.abs(v) >= 1000) return v.toFixed(0).replace('-', MINUS)
  return String(Number(v.toPrecision(3))).replace('-', MINUS)
}

/** A 1-2-5 step that gives roughly `target` intervals across `span`. */
export function niceStep(span: number, target: number): number {
  if (!(span > 0)) return 1
  const raw = span / Math.max(1, target)
  const mag = 10 ** Math.floor(Math.log10(raw))
  const n = raw / mag
  const s = n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10
  return s * mag
}

export function ticks(min: number, max: number, target: number): { values: number[]; step: number } {
  const step = niceStep(max - min, target)
  const values: number[] = []
  const start = Math.ceil(min / step - 1e-9) * step
  for (let v = start; v <= max + step * 1e-9; v += step) {
    values.push(Math.abs(v) < step * 1e-9 ? 0 : v)
    if (values.length > 50) break
  }
  return { values, step }
}

export function tickLabel(v: number, step: number): string {
  const decimals = Math.max(0, -Math.floor(Math.log10(step) + 1e-9))
  return v.toFixed(decimals).replace('-', MINUS)
}

/** Value range for a graph: always includes 0, padded, never zero-height. */
export function niceRange(values: ArrayLike<number>): [number, number] {
  let lo = 0
  let hi = 0
  for (let i = 0; i < values.length; i++) {
    const v = values[i]
    if (v < lo) lo = v
    if (v > hi) hi = v
  }
  if (hi - lo < 1e-9) return [-1, 1]
  const pad = (hi - lo) * 0.08
  return [lo < 0 ? lo - pad : 0, hi > 0 ? hi + pad : 0]
}
