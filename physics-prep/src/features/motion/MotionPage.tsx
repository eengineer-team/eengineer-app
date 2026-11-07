import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Pause, Play, RotateCcw } from 'lucide-react'
import type { MotionPreset } from '@/types/problem'
import { Button, ButtonLink, Card, Container, PageHeader } from '@/components/ui'
import { Chart } from './Chart'
import { ParamField, Segmented, SymText, Tabs } from './controls'
import { fmtFixed, fmtSig } from './format'
import { usePlayback, type Speed } from './hooks'
import { sampleSimulation, type Kin, type Result, type Sym } from './physics'
import {
  DEFAULT_PARAMS,
  FIELDS,
  PRESET_INFO,
  PRESET_ORDER,
  buildSimulation,
  isMotionPreset,
  type NumberField,
  type ParamsByPreset,
} from './presets'
import { Scene } from './scenes'

const SPEEDS: Speed[] = [0.25, 0.5, 1]
const plainSym = (s: Sym) => s.base + (s.sub ?? '')

export function MotionPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get('preset')
  const preset: MotionPreset = isMotionPreset(raw) ? raw : 'projectile'

  const [params, setParams] = useState<ParamsByPreset>(DEFAULT_PARAMS)
  const [channelIdx, setChannelIdx] = useState(0)
  const sim = useMemo(() => buildSimulation(preset, params), [preset, params])
  const series = useMemo(() => sampleSimulation(sim), [sim])
  const { t, playing, speed, setSpeed, play, pause, seek, reset } = usePlayback(sim.duration)

  // New preset: start from t = 0 (autoplay unless reduced motion) and show the first component.
  useEffect(() => {
    reset(true)
    setChannelIdx(0)
  }, [preset, reset])

  const selectPreset = (p: MotionPreset) => {
    if (p !== preset) setSearchParams({ preset: p })
  }

  function update<K extends MotionPreset>(key: K, patch: Partial<ParamsByPreset[K]>) {
    setParams((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }))
  }

  const info = PRESET_INFO[preset]
  const ch = Math.min(channelIdx, sim.channels.length - 1)
  const channel = sim.channels[ch]
  const kins = sim.at(t)
  const phase = sim.phase(t)
  const sceneLabel = `${info.title} simulation at t = ${fmtFixed(t)} s. ${phase}.`

  return (
    <Container>
      <PageHeader eyebrow="Free tool" title="Motion simulator">
        Change the setup, press play and watch position, velocity and acceleration evolve together. Every scene is drawn to scale
        with g = 9.8 m/s² and no air resistance.
      </PageHeader>

      <Tabs
        label="Motion presets"
        idPrefix="motion-tab"
        panelId="motion-panel"
        tabs={PRESET_ORDER.map((p) => ({ value: p, label: PRESET_INFO[p].title }))}
        value={preset}
        onChange={selectPreset}
      />

      <div
        id="motion-panel"
        role="tabpanel"
        aria-labelledby={`motion-tab-${preset}`}
        className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[auto_auto_1fr]"
      >
        {/* Scene + playback */}
        <Card className="min-w-0 self-start p-3 sm:p-4 lg:col-start-1 lg:row-start-1">
          <Scene sim={sim} t={t} label={sceneLabel} />
          <p className="mt-2 min-h-[2.5rem] text-sm text-muted">{phase}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-[3px] w-5 rounded bg-velocity" aria-hidden /> velocity <i>v</i>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-[3px] w-5 rounded bg-accel" aria-hidden /> acceleration <i>a</i>
            </span>
            <span>Arrow lengths are scaled to the largest value in this run.</span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={playing ? pause : play} aria-label={playing ? 'Pause' : 'Play'} className="w-28" disabled={sim.duration <= 0}>
              {playing ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
              {playing ? 'Pause' : 'Play'}
            </Button>
            <Button variant="secondary" onClick={() => reset(false)} aria-label="Reset to t = 0">
              <RotateCcw size={16} aria-hidden />
              Reset
            </Button>
            <Segmented<Speed>
              label="Playback speed"
              className="ml-auto"
              options={SPEEDS.map((s) => ({ value: s, label: `${s}×` }))}
              value={speed}
              onChange={setSpeed}
            />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <label htmlFor="motion-time" className="text-xs font-semibold text-muted">
              Time
            </label>
            <input
              id="motion-time"
              type="range"
              min={0}
              max={Math.max(sim.duration, 0)}
              step="any"
              value={t}
              aria-valuetext={`${fmtFixed(t)} seconds`}
              onChange={(e) => {
                pause()
                seek(Number(e.target.value))
              }}
              className="min-w-0 flex-1 cursor-pointer accent-accent"
            />
            <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
              {fmtFixed(t)} / {fmtFixed(sim.duration)} s
            </span>
          </div>
        </Card>

        {/* Parameters + live readouts */}
        <div className="min-w-0 space-y-6 self-start lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold">Setup</h2>
              <Button
                variant="ghost"
                className="px-2 py-1 text-xs"
                onClick={() => setParams((prev) => ({ ...prev, [preset]: DEFAULT_PARAMS[preset] }))}
              >
                Default values
              </Button>
            </div>
            <ParamsPanel preset={preset} params={params} update={update} />
          </Card>

          <Card>
            <h2 className="text-lg font-bold">Readouts</h2>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              <Readout label={<span className="font-mono italic">t</span>} value={fmtFixed(t)} unit="s" />
              {sim.channels.map((c, i) => (
                <ChannelReadouts key={c.key} pos={c.pos} vel={c.vel} acc={c.acc} kin={kins[i]} />
              ))}
              {sim.live(t).map((r) => (
                <Readout key={r.label} label={r.label} value={typeof r.value === 'number' ? fmtFixed(r.value) : r.value} unit={r.unit} />
              ))}
            </dl>
          </Card>
        </div>

        {/* Graphs */}
        <section aria-labelledby="motion-graphs" className="min-w-0 space-y-3 self-start lg:col-start-1 lg:row-span-2 lg:row-start-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 id="motion-graphs" className="text-lg font-bold">
                Graphs vs time
              </h2>
              <p className="text-xs text-muted">{channel.description}</p>
            </div>
            {sim.channels.length > 1 && (
              <Segmented<number>
                label="Graph component"
                options={sim.channels.map((c, i) => ({ value: i, label: c.short }))}
                value={ch}
                onChange={setChannelIdx}
              />
            )}
          </div>
          <Chart
            title={
              <>
                Position <SymText sym={channel.pos} /> (m)
              </>
            }
            name={`Position ${plainSym(channel.pos)}`}
            unit="m"
            times={series.times}
            values={series.values[ch][0]}
            tMax={sim.duration}
            t={t}
            value={kins[ch].p}
            tone="accent"
          />
          <Chart
            title={
              <>
                Velocity <SymText sym={channel.vel} /> (m/s)
              </>
            }
            name={`Velocity ${plainSym(channel.vel)}`}
            unit="m/s"
            times={series.times}
            values={series.values[ch][1]}
            tMax={sim.duration}
            t={t}
            value={kins[ch].v}
            tone="velocity"
          />
          <Chart
            title={
              <>
                Acceleration <SymText sym={channel.acc} /> (m/s²)
              </>
            }
            name={`Acceleration ${plainSym(channel.acc)}`}
            unit="m/s²"
            times={series.times}
            values={series.values[ch][2]}
            tMax={sim.duration}
            t={t}
            value={kins[ch].a}
            tone="accel"
          />
        </section>

        {/* Results + teaching notes */}
        <div className="min-w-0 space-y-6 self-start lg:col-start-2 lg:row-start-3">
          <Card>
            <h2 className="text-lg font-bold">Key results</h2>
            <dl className="mt-3 space-y-2 text-sm">
              {sim.results.map((r) => (
                <ResultRow key={r.label} r={r} />
              ))}
            </dl>
          </Card>
          <Card>
            <h2 className="text-lg font-bold">What to notice</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
              {info.notice.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <ButtonLink to="/practice" variant="secondary" className="mt-4 w-full">
              Try practice problems
            </ButtonLink>
          </Card>
        </div>
      </div>
    </Container>
  )
}

function Readout({ label, value, unit }: { label: ReactNode; value: string; unit?: string }) {
  return (
    <>
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-mono tabular-nums">
        {value}
        {unit && <span className="ml-1 text-muted">{unit}</span>}
      </dd>
    </>
  )
}

function ChannelReadouts({ pos, vel, acc, kin }: { pos: Sym; vel: Sym; acc: Sym; kin: Kin }) {
  return (
    <>
      <Readout label={<SymText sym={pos} />} value={fmtFixed(kin.p)} unit="m" />
      <Readout label={<SymText sym={vel} />} value={fmtFixed(kin.v)} unit="m/s" />
      <Readout label={<SymText sym={acc} />} value={fmtFixed(kin.a)} unit="m/s²" />
    </>
  )
}

function ResultRow({ r }: { r: Result }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <dt className="text-muted">{r.label}</dt>
      <dd className="shrink-0 text-right font-mono tabular-nums">
        {typeof r.value === 'number' ? fmtSig(r.value) : <span className="font-sans">{r.value}</span>}
        {r.unit && <span className="ml-1 text-muted">{r.unit}</span>}
      </dd>
    </div>
  )
}

function FieldList<P>({
  idPrefix,
  fields,
  values,
  onChange,
}: {
  idPrefix: string
  fields: NumberField<P>[]
  values: P
  onChange: (patch: Partial<P>) => void
}) {
  return (
    <>
      {fields.map((f) => (
        <ParamField
          key={f.key}
          id={`${idPrefix}-${f.key}`}
          label={f.label}
          symbol={f.symbol}
          unit={f.unit}
          min={f.min}
          max={f.max}
          step={f.step}
          hint={f.hint}
          value={values[f.key] as unknown as number}
          onChange={(v) => onChange({ [f.key]: v } as Partial<P>)}
        />
      ))}
    </>
  )
}

function ParamsPanel({
  preset,
  params,
  update,
}: {
  preset: MotionPreset
  params: ParamsByPreset
  update: <K extends MotionPreset>(key: K, patch: Partial<ParamsByPreset[K]>) => void
}) {
  switch (preset) {
    case 'projectile':
      return <FieldList idPrefix="projectile" fields={FIELDS.projectile} values={params.projectile} onChange={(p) => update('projectile', p)} />
    case 'incline':
      return (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium" id="incline-direction-label">
              Initial direction
            </span>
            <Segmented<'up' | 'down'>
              label="Initial direction of motion"
              options={[
                { value: 'up', label: 'Up the slope' },
                { value: 'down', label: 'Down the slope' },
              ]}
              value={params.incline.direction}
              onChange={(direction) => update('incline', { direction })}
            />
          </div>
          <FieldList idPrefix="incline" fields={FIELDS.incline} values={params.incline} onChange={(p) => update('incline', p)} />
          <p className="text-xs text-muted">
            {params.incline.direction === 'up' ? 'The block starts at the bottom of the ramp.' : 'The block starts at the top of the ramp.'}
          </p>
        </>
      )
    case 'atwood':
      return <FieldList idPrefix="atwood" fields={FIELDS.atwood} values={params.atwood} onChange={(p) => update('atwood', p)} />
    case 'free-fall':
      return <FieldList idPrefix="free-fall" fields={FIELDS['free-fall']} values={params['free-fall']} onChange={(p) => update('free-fall', p)} />
    case 'spring':
      return (
        <>
          <FieldList idPrefix="spring" fields={FIELDS.spring} values={params.spring} onChange={(p) => update('spring', p)} />
          <p className="text-xs text-muted">Released from rest at x = +A on a frictionless floor. Integrated numerically with RK4.</p>
        </>
      )
  }
}
