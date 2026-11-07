import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

// Shared primitives. Feature folders should build on these instead of re-styling buttons/cards.

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

type Variant = 'primary' | 'secondary' | 'ghost'
// Mirrors eengineer-app's button: near-black CTA on welcome pages, gold CTA on dashboard pages
// (both via the cta token), 4px corners, medium weight.
const variants: Record<Variant, string> = {
  primary: 'bg-cta text-cta-ink hover:bg-cta-hover',
  secondary: 'border border-text/30 text-text hover:bg-text/5',
  ghost: 'text-text hover:bg-text/5',
}
const base =
  'inline-flex min-h-[40px] items-center justify-center gap-2 rounded px-5 py-2 text-sm font-medium transition-colors duration-150 select-none ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ' +
  'disabled:cursor-not-allowed disabled:opacity-40'

export function Button({ variant = 'primary', className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={cx(base, variants[variant], className)} {...rest} />
}

export function ButtonLink({ variant = 'primary', className, ...rest }: LinkProps & { variant?: Variant }) {
  return <Link className={cx(base, variants[variant], className)} {...rest} />
}

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('rounded-lg border border-border bg-surface p-5', className)} {...rest} />
}

export function Container({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('mx-auto w-full max-w-6xl px-4 sm:px-6', className)} {...rest} />
}

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'accent' | 'good' | 'bad'; children: ReactNode }) {
  const tones = {
    neutral: 'border-border text-muted',
    accent: 'border-accent/40 text-accent',
    good: 'border-good/40 text-good',
    bad: 'border-bad/40 text-bad',
  }
  return <span className={cx('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', tones[tone])}>{children}</span>
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-8">
      {eyebrow && <p className="mb-2 text-label uppercase text-accent">{eyebrow}</p>}
      <h1 className="text-3xl font-bold tracking-tight sm:text-heading">{title}</h1>
      {children && <div className="mt-3 max-w-2xl text-muted">{children}</div>}
    </header>
  )
}
