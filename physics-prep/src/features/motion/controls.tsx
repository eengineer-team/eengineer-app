import { useState, type KeyboardEvent, type ReactNode } from 'react'
import { cx } from '@/components/ui'
import type { Sym } from './physics'

/** Renders a physics symbol with an HTML subscript, e.g. v<sub>x</sub>. */
export function SymText({ sym }: { sym: Sym }) {
  return (
    <span className="font-mono italic">
      {sym.base}
      {sym.sub && <sub className="not-italic">{sym.sub}</sub>}
    </span>
  )
}

const decimalsOf = (step: number) => (String(step).split('.')[1] ?? '').length

interface ParamFieldProps {
  id: string
  label: string
  symbol: string
  unit: string
  min: number
  max: number
  step: number
  hint?: string
  value: number
  onChange: (v: number) => void
}

/** Slider plus number box for one parameter. Typing commits valid in-range values immediately and clamps on blur. */
export function ParamField({ id, label, symbol, unit, min, max, step, hint, value, onChange }: ParamFieldProps) {
  const [draft, setDraft] = useState<string | null>(null)
  const decimals = decimalsOf(step)
  const shown = draft ?? value.toFixed(decimals)
  const clampValue = (n: number) => Math.min(max, Math.max(min, n))

  const commit = () => {
    if (draft !== null) {
      const n = parseFloat(draft)
      if (Number.isFinite(n)) onChange(clampValue(n))
    }
    setDraft(null)
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={`${id}-num`} className="min-w-0 text-sm font-medium">
          {label} <span className="font-mono italic text-muted">{symbol}</span>
          {hint && <span className="ml-1 text-xs font-normal text-muted">({hint})</span>}
        </label>
        <div className="flex shrink-0 items-center gap-1.5">
          <input
            id={`${id}-num`}
            type="number"
            inputMode="decimal"
            min={min}
            max={max}
            step={step}
            value={shown}
            onChange={(e) => {
              setDraft(e.target.value)
              const n = parseFloat(e.target.value)
              if (Number.isFinite(n) && n >= min && n <= max) onChange(n)
            }}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            }}
            className="w-20 rounded-md border border-border bg-bg px-2 py-1 text-right font-mono text-sm text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
          <span className="w-9 text-xs text-muted">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        aria-label={`${label}${unit ? ` (${unit})` : ''}`}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          setDraft(null)
          onChange(Number(e.target.value))
        }}
        className="block w-full cursor-pointer accent-accent"
      />
    </div>
  )
}

interface SegmentedProps<T extends string | number> {
  label: string
  options: { value: T; label: ReactNode }[]
  value: T
  onChange: (v: T) => void
  className?: string
}

/** Small toggle group (aria-pressed buttons). */
export function Segmented<T extends string | number>({ label, options, value, onChange, className }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className={cx('inline-flex rounded-lg border border-border bg-bg p-0.5', className)}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cx(
            'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent',
            o.value === value ? 'bg-accent text-accent-ink' : 'text-muted hover:text-text',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

interface TabsProps<T extends string> {
  label: string
  idPrefix: string
  panelId: string
  tabs: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}

/** WAI-ARIA tab list with arrow-key navigation. */
export function Tabs<T extends string>({ label, idPrefix, panelId, tabs, value, onChange }: TabsProps<T>) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = tabs.findIndex((t) => t.value === value)
    let next = -1
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length
    else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = tabs.length - 1
    if (next < 0) return
    e.preventDefault()
    onChange(tabs[next].value)
    document.getElementById(`${idPrefix}-${tabs[next].value}`)?.focus()
  }
  return (
    <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="flex flex-wrap gap-1.5">
      {tabs.map((t) => {
        const selected = t.value === value
        return (
          <button
            key={t.value}
            id={`${idPrefix}-${t.value}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.value)}
            className={cx(
              'rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              selected ? 'border-accent bg-accent text-accent-ink' : 'border-border bg-surface text-muted hover:text-text',
            )}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
