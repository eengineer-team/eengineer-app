import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Card, Container, PageHeader } from '@/components/ui'
import { FbdBuilder } from './FbdBuilder'
import { SCENARIOS, getScenario } from './scenarios'
import { ScenarioScene } from './ScenarioScene'

// Route: /tools/free-body[?preset=<FreeBodyPreset>]. No (or unknown) preset shows the scenario picker.
export function FreeBodyPage() {
  const [params] = useSearchParams()
  const preset = params.get('preset')
  const scenario = getScenario(preset)
  // Keyed so switching scenarios starts with an empty diagram.
  if (scenario) return <FbdBuilder key={scenario.id} scenario={scenario} />
  return <ScenarioPicker unknownPreset={preset} />
}

function ScenarioPicker({ unknownPreset }: { unknownPreset: string | null }) {
  return (
    <Container>
      <PageHeader eyebrow="Free tool" title="Free-body diagram builder">
        Pick a situation, draw every force on the object, and get feedback on what’s missing, extra or pointing the
        wrong way.
      </PageHeader>
      {unknownPreset && (
        <p className="mb-6 rounded-lg border border-border bg-surface2 px-4 py-3 text-sm text-muted" role="status">
          We don’t have a scenario called “{unknownPreset}”. Choose one below.
        </p>
      )}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SCENARIOS.map((s) => (
          <li key={s.id}>
            <Link
              to={`/tools/free-body?preset=${s.id}`}
              className="group block h-full rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Card className="flex h-full flex-col transition-colors group-hover:border-accent">
                <div className="mb-4 rounded-lg bg-bg p-3">
                  <ScenarioScene id={s.id} title={`Sketch: ${s.title}`} className="mx-auto max-w-[240px]" />
                </div>
                <h2 className="text-lg font-bold">{s.title}</h2>
                <p className="mt-1 flex-1 text-sm text-muted">{s.summary}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent">
                  Draw the forces <ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  )
}
