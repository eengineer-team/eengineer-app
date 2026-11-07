import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, ChevronDown, ListChecks, MessageCircleQuestionMark, MousePointerClick } from 'lucide-react'
import { Badge, ButtonLink, Card, Container, cx } from '@/components/ui'
import { UNIT_LABELS, UNIT_ORDER } from '@/types/problem'
import { problems } from '@/content/problems'
import { HeroProjectile } from './HeroProjectile'
import { WaitlistForm } from './WaitlistForm'
import { FREE_FEATURES, PRO_FEATURES, PRO_PRICE } from './plans'

const FEATURES = [
  {
    icon: MousePointerClick,
    title: 'Interactive tools',
    body: 'Build free-body diagrams force by force and run motion setups (projectiles, inclines, Atwood machines, springs) with numbers you control.',
    to: '/tools',
    link: 'Open the tools',
  },
  {
    icon: ListChecks,
    title: 'Original problems, worked out',
    body: 'Exam-style problems written from scratch for this site, each with a hint and a step-by-step solution that shows why every line follows.',
    to: '/practice',
    link: 'Browse problems',
  },
  {
    icon: MessageCircleQuestionMark,
    title: 'A tutor that asks back',
    body: 'Stuck? The AI tutor responds with the next question to think about, not the final answer, so the reasoning ends up in your head.',
    to: '/practice',
    link: 'Try it on a problem',
  },
]

const STEPS = [
  {
    title: 'Play with the setup',
    body: 'Open a simulator and change one thing: the angle, the mass, the friction. Watch what moves and what stays the same.',
  },
  {
    title: 'Solve an original problem',
    body: 'Work an exam-style question on the same idea. Check your number, then compare your steps with the worked solution.',
  },
  {
    title: 'Get unstuck the right way',
    body: 'Ask the tutor when you hit a wall. It points you at the next step so you can finish the problem yourself.',
  },
]

const FAQ: Array<{ q: string; a: ReactNode }> = [
  {
    q: 'Is it free?',
    a: (
      <>
        Yes. Every interactive tool, a starter set of problems with full solutions, and 5 AI tutor questions a day are free, with
        no account needed. Pro is planned at {PRO_PRICE}/month for students who want the full problem bank, mock exams and
        unlimited tutoring. It isn’t live yet. <Link to="/pro" className="font-medium text-accent underline-offset-2 hover:underline">See what Pro includes</Link>.
      </>
    ),
  },
  {
    q: 'Is this official College Board material?',
    a: 'No. eengineer Physics is independent and is not affiliated with or endorsed by the College Board. Every problem and explanation here is original material written for this site; we never copy released exam questions.',
  },
  {
    q: 'Which exam does it cover?',
    a: 'AP Physics C: Mechanics, the calculus-based mechanics course, across all seven units from kinematics to gravitation. It is built for students sitting the exam in May. It does not cover Physics C: Electricity and Magnetism or Physics 1 and 2.',
  },
  {
    q: 'How does the AI tutor work?',
    a: 'You ask about the problem you’re on. The tutor can see that problem and replies with a hint or a guiding question, such as which forces act on the block or what stays constant, rather than handing over the answer. It can make mistakes, so treat it as a study partner and check its reasoning against the worked solution.',
  },
]

function SectionHeading({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-10 max-w-2xl">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">{eyebrow}</p>
      <h2 id={id} className="text-2xl font-bold tracking-tight sm:text-3xl">
        {title}
      </h2>
      {children && <p className="mt-3 text-muted">{children}</p>}
    </div>
  )
}

function FeatureList({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cx('space-y-2.5 text-sm', className)}>
      {items.map((f) => (
        <li key={f} className="flex items-start gap-2.5">
          <Check size={16} className="mt-0.5 shrink-0 text-good" aria-hidden />
          <span>{f}</span>
        </li>
      ))}
    </ul>
  )
}

export function LandingPage() {
  useEffect(() => {
    document.title = 'eengineer Physics · AP Physics C: Mechanics, learned by doing'
  }, [])

  const freeCount = problems.filter((p) => p.free).length

  return (
    <div className="space-y-24 sm:space-y-32">
      {/* Hero */}
      <Container>
        {/* minmax(0, …) lets the column shrink below its content's min width on narrow phones. */}
        <section
          className="grid grid-cols-[minmax(0,1fr)] items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14"
          aria-labelledby="hero-title"
        >
          <div>
            <Badge tone="accent">AP Physics C: Mechanics · free to start</Badge>
            <h1 id="hero-title" className="mt-5 text-[2.125rem] font-extrabold leading-[1.05] tracking-tight min-[360px]:text-[2.5rem] sm:text-5xl lg:text-6xl">
              Learn mechanics by <span className="text-accent">building and moving</span> things.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted">
              Draw the forces. Launch the projectile. Change the angle and see what happens. Then prove you understand it on
              original exam-style problems with step-by-step solutions. Less memorising, more knowing why.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink to="/tools/motion" className="px-5 py-3 text-base">
                Open the motion simulator
                <ArrowRight size={18} aria-hidden />
              </ButtonLink>
              <ButtonLink to="/practice" variant="secondary" className="px-5 py-3 text-base">
                Try practice problems
              </ButtonLink>
            </div>
            <p className="mt-5 text-sm text-muted">No account needed. Independent and original, not affiliated with College Board.</p>
          </div>
          <HeroProjectile />
        </section>
      </Container>

      {/* What you get */}
      <Container>
        <section aria-labelledby="features-title">
          <SectionHeading id="features-title" eyebrow="What you get" title="Three ways in, one goal: understanding that holds up under exam pressure." />
          <div className="grid gap-5 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body, to, link }) => (
              <Card key={title} className="flex flex-col p-6">
                <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  <Icon size={22} aria-hidden />
                </span>
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{body}</p>
                <Link
                  to={to}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent underline-offset-4 hover:underline"
                >
                  {link}
                  <ArrowRight size={15} aria-hidden />
                </Link>
              </Card>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-2" aria-label="Units covered">
            {UNIT_ORDER.map((u, i) => (
              <span key={u} className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
                <span className="font-mono text-accent">{i + 1}</span>
                {UNIT_LABELS[u]}
              </span>
            ))}
          </div>
        </section>
      </Container>

      {/* How it works */}
      <section aria-labelledby="how-title" className="border-y border-border bg-surface2/50 py-20">
        <Container>
          <SectionHeading id="how-title" eyebrow="How it works" title="See it, solve it, own it." />
          <ol className="grid gap-8 md:grid-cols-3 md:gap-6">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative">
                <span className="font-display text-5xl font-extrabold leading-none text-accent/40" aria-hidden>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-3 text-lg font-bold">
                  <span className="sr-only">Step {i + 1}: </span>
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Free vs Pro */}
      <Container>
        <section aria-labelledby="plans-title">
          <SectionHeading id="plans-title" eyebrow="Free and Pro" title="Start free. Stay free if it’s enough.">
            The tools and a starter set of problems are free. Pro is for students who want more practice volume before May.
          </SectionHeading>
          <div className="grid gap-5 md:grid-cols-2">
            <Card className="p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-xl font-bold">Free</h3>
                <p className="font-display text-2xl font-bold">$0</p>
              </div>
              <p className="mt-1 text-sm text-muted">
                {freeCount > 0 ? `${freeCount} starter problems available now.` : 'Available now, no account needed.'}
              </p>
              <FeatureList items={FREE_FEATURES} className="mt-5" />
            </Card>
            <Card className="relative border-accent/50 p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="flex items-center gap-2 text-xl font-bold">
                  Pro <Badge tone="accent">Coming soon</Badge>
                </h3>
                <p className="font-display text-2xl font-bold">
                  {PRO_PRICE}
                  <span className="text-sm font-medium text-muted">/month</span>
                </p>
              </div>
              <p className="mt-1 text-sm text-muted">Planned to launch before exam season.</p>
              <FeatureList items={PRO_FEATURES} className="mt-5" />
            </Card>
          </div>
          <div className="mt-6">
            <ButtonLink to="/pro" variant="secondary">
              Compare Free and Pro
              <ArrowRight size={16} aria-hidden />
            </ButtonLink>
          </div>
        </section>
      </Container>

      {/* Early access */}
      <Container>
        <section
          aria-labelledby="early-title"
          className="relative overflow-hidden rounded-lg border border-accent/40 bg-surface px-6 py-10 sm:px-10 sm:py-12"
        >
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl" aria-hidden />
          <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">Early access</p>
              <h2 id="early-title" className="text-2xl font-bold tracking-tight sm:text-3xl">
                Hear first when new units and Pro land.
              </h2>
              <p className="mt-3 text-muted">
                Leave your email and we’ll tell you when new problems and mock exams are ready, plus the early-access price for Pro.
              </p>
            </div>
            <WaitlistForm
              source="landing"
              successBody="Thanks. We’ll email you when early access opens. Until then, the tools and starter problems are open to you."
            />
          </div>
        </section>
      </Container>

      {/* FAQ */}
      <Container>
        <section aria-labelledby="faq-title" className="mx-auto max-w-3xl">
          <h2 id="faq-title" className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">
            Questions
          </h2>
          <div className="divide-y divide-border border-y border-border">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group py-1">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg py-4 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
                  {q}
                  <ChevronDown size={18} className="shrink-0 text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
                </summary>
                <p className="pb-5 pr-8 text-sm leading-relaxed text-muted">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </Container>
    </div>
  )
}
