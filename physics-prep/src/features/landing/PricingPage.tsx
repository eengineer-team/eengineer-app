import { useEffect, useState } from 'react'
import { ArrowRight, Check, Info, Minus } from 'lucide-react'
import { Badge, Button, ButtonLink, Card, Container, PageHeader } from '@/components/ui'
import { WaitlistForm } from './WaitlistForm'
import { COMPARISON, FREE_FEATURES, PRO_FEATURES, PRO_PRICE, type Cell } from './plans'

const PRO_NOT_LIVE = 'Pro isn’t live yet; we’ll email you the early-access price.'

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3 text-sm">
      {items.map((f) => (
        <li key={f} className="flex items-start gap-2.5">
          <Check size={16} className="mt-0.5 shrink-0 text-good" aria-hidden />
          <span>{f}</span>
        </li>
      ))}
    </ul>
  )
}

function CellValue({ value }: { value: Cell }) {
  if (value === true)
    return (
      <>
        <Check size={18} className="mx-auto text-good" aria-hidden />
        <span className="sr-only">Included</span>
      </>
    )
  if (value === false)
    return (
      <>
        <Minus size={18} className="mx-auto text-muted/60" aria-hidden />
        <span className="sr-only">Not included</span>
      </>
    )
  return <span className="text-text">{value}</span>
}

export function PricingPage() {
  useEffect(() => {
    document.title = 'Free and Pro · eengineer Physics'
  }, [])

  // The button swaps for the form; autoFocus on the email field moves focus (and scroll) with it.
  const [captureOpen, setCaptureOpen] = useState(false)

  return (
    <Container>
      <PageHeader eyebrow="Free and Pro" title="Everything you need to start is free.">
        The interactive tools, starter problems and daily tutor questions cost nothing. Pro adds volume and exam practice for
        the final stretch before May.
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Free */}
        <Card className="flex flex-col p-6 sm:p-8">
          <h2 className="text-2xl font-bold">Free</h2>
          <p className="mt-4 font-display text-4xl font-extrabold">$0</p>
          <p className="mt-1 text-sm text-muted">Available now. No account, no card.</p>
          <div className="mt-6 flex-1">
            <FeatureList items={FREE_FEATURES} />
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to="/tools" className="py-2.5">
              Start with the tools
              <ArrowRight size={16} aria-hidden />
            </ButtonLink>
            <ButtonLink to="/practice" variant="secondary" className="py-2.5">
              Practice problems
            </ButtonLink>
          </div>
        </Card>

        {/* Pro */}
        <Card className="relative flex flex-col border-2 border-accent/60 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold">Pro</h2>
            <Badge tone="accent">Not live yet</Badge>
          </div>
          <p className="mt-4 font-display text-4xl font-extrabold">
            {PRO_PRICE}
            <span className="ml-1 font-sans text-base font-medium text-muted">/month</span>
          </p>
          <p className="mt-1 text-sm text-muted">Planned price. Launching before exam season.</p>
          <div className="mt-6 flex-1">
            <FeatureList items={PRO_FEATURES} />
          </div>

          <div className="mt-8">
            {!captureOpen ? (
              <Button
                type="button"
                className="w-full py-2.5 sm:w-auto"
                onClick={() => setCaptureOpen(true)}
              >
                Get Pro
              </Button>
            ) : (
              <div className="rounded-lg border border-border bg-surface2/60 p-4">
                <p className="mb-4 flex items-start gap-2 text-sm text-text">
                  <Info size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                  <span>{PRO_NOT_LIVE} Nothing is charged, and you don’t need a card.</span>
                </p>
                <WaitlistForm
                  source="pro-intent"
                  submitLabel="Email me the price"
                  successTitle="Thanks, you’re on the Pro list."
                  successBody={`${PRO_NOT_LIVE} Free tools and starter problems are yours to use in the meantime.`}
                  autoFocus
                />
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Comparison */}
      <section aria-labelledby="compare-title" className="mt-20">
        <h2 id="compare-title" className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
          Side by side
        </h2>
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <table className="w-full table-fixed text-left text-sm">
            <caption className="sr-only">Features included in Free and Pro</caption>
            <colgroup>
              <col />
              <col className="w-[26%] sm:w-[22%]" />
              <col className="w-[26%] sm:w-[22%]" />
            </colgroup>
            <thead className="bg-surface2/60">
              <tr>
                <th scope="col" className="px-3 py-3 font-semibold sm:px-5">
                  Feature
                </th>
                <th scope="col" className="px-2 py-3 text-center font-semibold sm:px-4">
                  Free
                </th>
                <th scope="col" className="px-2 py-3 text-center font-semibold text-accent sm:px-4">
                  Pro
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {COMPARISON.map((row) => (
                <tr key={row.feature}>
                  <th scope="row" className="px-3 py-3 font-normal text-text sm:px-5">
                    {row.feature}
                  </th>
                  <td className="px-2 py-3 text-center text-muted sm:px-4">
                    <CellValue value={row.free} />
                  </td>
                  <td className="px-2 py-3 text-center sm:px-4">
                    <CellValue value={row.pro} />
                  </td>
                </tr>
              ))}
              <tr className="bg-surface2/40">
                <th scope="row" className="px-3 py-3 font-semibold sm:px-5">
                  Price
                </th>
                <td className="px-2 py-3 text-center font-semibold sm:px-4">$0</td>
                <td className="px-2 py-3 text-center font-semibold sm:px-4">
                  {PRO_PRICE}/mo<span className="block text-xs font-normal text-muted">planned</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Honest notes */}
      <section aria-labelledby="notes-title" className="mt-16 grid gap-6 md:grid-cols-3">
        <h2 id="notes-title" className="sr-only">
          Good to know
        </h2>
        {[
          {
            title: 'Why tell you now?',
            body: 'We’re building Pro next and want to know how many students would actually use it before exam season. Your email helps us decide what to build first.',
          },
          {
            title: 'Will Free stay free?',
            body: 'Yes. The tools, the starter problems and the daily tutor questions are the core of the site, not a trial.',
          },
          {
            title: 'Is this College Board material?',
            body: 'No. Every problem is original and written for this site. eengineer Physics is independent and not affiliated with the College Board.',
          },
        ].map((n) => (
          <div key={n.title} className="border-l-2 border-accent/50 pl-4">
            <h3 className="font-bold">{n.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{n.body}</p>
          </div>
        ))}
      </section>
    </Container>
  )
}
