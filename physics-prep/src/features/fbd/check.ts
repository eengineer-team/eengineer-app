import { FORCE_INFO, angleDiff, labelMisconception, type ForceType, type Misconception, type PlacedForce } from './forces'
import type { ExpectedForce, Scenario } from './scenarios'

// Pure checker: compares a student's diagram with a scenario's expected force set.

export const DIRECTION_TOLERANCE = 20

export type FeedbackKind = 'correct' | 'missing' | 'kind' | 'direction' | 'extra' | 'label' | 'size'

export interface FeedbackItem {
  kind: FeedbackKind
  text: string
  /** The placed force this item is about, if any (lets the UI select it). */
  forceId?: string
}

export interface CheckResult {
  allCorrect: boolean
  /** Expected forces present with the right type and direction. */
  correctCount: number
  expectedCount: number
  items: FeedbackItem[]
}

const FRICTION: ForceType[] = ['kinetic-friction', 'static-friction']

const GENERIC_EXTRA: Record<ForceType, string> = {
  gravity: 'Earth pulls on the object only once. Draw a single gravity arrow.',
  normal: 'Nothing in this setup presses on the object as a surface would, so there is no normal force.',
  tension: 'No rope, string or cable is attached to the object, so there is no tension.',
  'kinetic-friction': 'Nothing is sliding against the object, so there is no kinetic friction.',
  'static-friction': 'No surface is gripping the object, so there is no static friction.',
  applied: 'Nothing pushes on the object directly. Every force needs something that exerts it.',
  spring: 'There is no spring in this setup, so there is no spring force.',
}

const NOT_A_FORCE_TEXT: Record<Misconception, string> = {
  motion:
    'There’s no “force of motion” (or force of inertia, velocity or acceleration). Moving objects don’t carry a force along with them. Every force on a free-body diagram must be exerted by something.',
  net: 'The net force (ma) is the sum of the forces you’ve drawn, not an extra force on the object. Leave it off the diagram.',
}

interface Match {
  expected: ExpectedForce
  placed: PlacedForce
  kindMismatch: boolean
}

function name(type: ForceType) {
  return FORCE_INFO[type].name
}

export function checkDiagram(scenario: Scenario, forces: PlacedForce[]): CheckResult {
  const expectedCount = scenario.expected.length
  if (forces.length === 0) {
    return {
      allCorrect: false,
      correctCount: 0,
      expectedCount,
      items: [{ kind: 'missing', text: `Add the forces acting on ${scenario.object} from the palette, then check again.` }],
    }
  }

  const unused = new Set(forces.map((f) => f.id))
  const matches: Match[] = []
  const missing: ExpectedForce[] = []

  // Exact type matches first so a misnamed friction can't steal a slot from a correct one.
  const pick = (exp: ExpectedForce, types: ForceType[]) => {
    let best: PlacedForce | undefined
    for (const f of forces) {
      if (!unused.has(f.id) || !types.includes(f.type)) continue
      if (!best || angleDiff(f.angle, exp.angle) < angleDiff(best.angle, exp.angle)) best = f
    }
    return best
  }
  const pending: ExpectedForce[] = []
  for (const exp of scenario.expected) {
    const f = pick(exp, [exp.type])
    if (f) {
      unused.delete(f.id)
      matches.push({ expected: exp, placed: f, kindMismatch: false })
    } else pending.push(exp)
  }
  for (const exp of pending) {
    const alt = FRICTION.includes(exp.type) ? pick(exp, FRICTION.filter((t) => t !== exp.type)) : undefined
    if (alt) {
      unused.delete(alt.id)
      matches.push({ expected: exp, placed: alt, kindMismatch: true })
    } else missing.push(exp)
  }

  const items: FeedbackItem[] = []
  const correct: FeedbackItem[] = []

  for (const exp of missing) items.push({ kind: 'missing', text: `Missing a force. ${exp.missingHint}` })

  for (const m of matches) {
    const dirOk = angleDiff(m.placed.angle, m.expected.angle) <= DIRECTION_TOLERANCE
    if (m.kindMismatch) {
      const why =
        m.expected.type === 'kinetic-friction'
          ? `${capital(scenario.object)} is sliding, so the friction from ${m.expected.source} is kinetic, not static.`
          : `${capital(scenario.object)} isn’t slipping, so the friction from ${m.expected.source} is static, not kinetic.`
      items.push({ kind: 'kind', forceId: m.placed.id, text: why })
    }
    if (!dirOk) {
      items.push({
        kind: 'direction',
        forceId: m.placed.id,
        text: `Check the direction of ${name(m.placed.type).toLowerCase()}. ${m.expected.directionHint}`,
      })
    } else if (!m.kindMismatch) {
      correct.push({ kind: 'correct', forceId: m.placed.id, text: `${name(m.placed.type)} from ${m.expected.source}: right type and direction.` })
    }
  }

  for (const f of forces) {
    if (!unused.has(f.id)) continue
    let text: string
    const mis = labelMisconception(f.label)
    if (mis) text = NOT_A_FORCE_TEXT[mis]
    else if (scenario.expected.some((e) => e.type === f.type)) {
      const src = scenario.expected.find((e) => e.type === f.type)!.source
      text = `You have more than one ${name(f.type).toLowerCase()} arrow. Each interaction gives exactly one force, so ${src} contributes a single ${name(f.type).toLowerCase()} on ${scenario.object}.`
    } else text = scenario.extraHints[f.type] ?? GENERIC_EXTRA[f.type]
    items.push({ kind: 'extra', forceId: f.id, text: `Extra force (${f.label || name(f.type)}). ${text}` })
  }

  // A real force with a "force of motion"-style label still deserves a nudge.
  for (const m of matches) {
    const mis = labelMisconception(m.placed.label)
    if (mis) {
      items.push({
        kind: 'label',
        forceId: m.placed.id,
        text:
          `Your ${name(m.placed.type).toLowerCase()} is labelled “${m.placed.label}”, but it is one individual force exerted by ${m.expected.source}. ` +
          (mis === 'net'
            ? 'The net force is the sum of all the forces, so it never gets its own label on the diagram. '
            : 'Forces are named after what exerts them, not after the motion. ') +
          `Try ${FORCE_INFO[m.placed.type].label}.`,
      })
    }
  }

  // Only one qualitative size hint, and only once the force set itself is right.
  const rule = scenario.sizeRule
  if (items.length === 0 && rule) {
    const a = matches.find((m) => m.expected.type === rule.a)?.placed
    const b = matches.find((m) => m.expected.type === rule.b)?.placed
    if (a && b && !sizeOk(a.length, b.length, rule.relation)) items.push({ kind: 'size', forceId: a.id, text: rule.hint })
  }

  return {
    allCorrect: items.length === 0,
    correctCount: correct.length,
    expectedCount,
    items: [...items, ...correct],
  }
}

function sizeOk(a: number, b: number, relation: 'greater' | 'less' | 'equal') {
  if (relation === 'greater') return a > b * 1.08
  if (relation === 'less') return a < b * 0.95
  return Math.abs(a - b) <= 0.12 * Math.max(a, b)
}

function capital(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
