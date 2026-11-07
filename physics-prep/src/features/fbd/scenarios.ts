import type { FreeBodyPreset } from '@/types/problem'
import type { ForceType } from './forces'

// Scenario data for the free-body diagram builder. Pure data, no React.
// Angles: degrees counterclockwise from +x (right). Up = 90, left = 180, down = 270.

export interface ExpectedForce {
  type: ForceType
  angle: number
  /** What exerts the force, e.g. "the floor". Used in feedback. */
  source: string
  /** Shown when the type is present but the direction is off. Explains, does not give the angle. */
  directionHint: string
  /** Shown when the force is missing. Points at the interaction, not at the answer. */
  missingHint: string
  /** Arrow length used when the answer is revealed. */
  answerLength: number
  /** Plain-language direction shown with the revealed answer. */
  answerDirection: string
}

export interface SizeRule {
  /** length(a) should be greater/less/equal compared with length(b). */
  a: ForceType
  b: ForceType
  relation: 'greater' | 'less' | 'equal'
  hint: string
}

/** Reference arrow (velocity or acceleration) drawn on the canvas for context. Not a force. */
export interface MotionCue {
  kind: 'velocity' | 'accel'
  angle: number
  label: string
  /** True when the object is at rest: the cue is drawn as text only. */
  atRest?: boolean
}

export interface Scenario {
  id: FreeBodyPreset
  title: string
  /** One-line summary for the picker card. */
  summary: string
  /** Full setup shown above the builder. */
  description: string
  /** How the object is referred to in feedback, e.g. "the block". */
  object: string
  shape: 'block' | 'mass' | 'person'
  /** Rotation of the reference axes in degrees (incline uses axes along and perpendicular to the slope). */
  axesTilt: number
  axesNote?: string
  motion: MotionCue
  expected: ExpectedForce[]
  /** Specific explanations for forces that do not belong in this scenario. */
  extraHints: Partial<Record<ForceType, string>>
  sizeRule?: SizeRule
  /** Shown after a correct check (and with the revealed answer). */
  why: string[]
}

const NO_SPRING = 'There is no spring anywhere in this setup, so there is no spring force.'

export const SCENARIOS: Scenario[] = [
  {
    id: 'block-on-floor-pulled',
    title: 'Block pulled across a floor',
    summary: 'A rope at 30° drags a block to the right over a rough floor.',
    description:
      'A block slides to the right across a rough, level floor. A rope attached to the block pulls on it at 30° above the horizontal. Draw every force acting on the block.',
    object: 'the block',
    shape: 'block',
    axesTilt: 0,
    motion: { kind: 'velocity', angle: 0, label: 'v' },
    expected: [
      {
        type: 'gravity',
        angle: 270,
        source: 'Earth',
        directionHint: 'Gravity always points straight down, toward the center of Earth.',
        missingHint: 'Every object near Earth’s surface is pulled by Earth. Which force is that?',
        answerLength: 110,
        answerDirection: 'straight down',
      },
      {
        type: 'normal',
        angle: 90,
        source: 'the floor',
        directionHint: 'A normal force points perpendicular to the surface, away from it. The floor is level.',
        missingHint: 'The block rests on the floor. What does the floor do to keep the block from sinking into it?',
        answerLength: 85,
        answerDirection: 'straight up',
      },
      {
        type: 'tension',
        angle: 30,
        source: 'the rope',
        directionHint: 'Tension pulls along the rope, away from the block. The rope is tilted 30° above the horizontal.',
        missingHint: 'Something attached to the block is pulling on it. Which force does a rope exert?',
        answerLength: 120,
        answerDirection: 'along the rope, 30° above the horizontal',
      },
      {
        type: 'kinetic-friction',
        angle: 180,
        source: 'the floor',
        directionHint:
          'Kinetic friction opposes the sliding. It points opposite to the block’s velocity relative to the floor, not opposite to the rope.',
        missingHint: 'The floor is rough and the block is sliding over it. The floor exerts a second force besides the normal force.',
        answerLength: 70,
        answerDirection: 'to the left, opposite the sliding',
      },
    ],
    extraHints: {
      applied:
        'Nothing pushes the block directly. The rope is the only thing pulling, and that is tension. If you meant a “force of motion”: moving objects don’t carry a force with them.',
      'static-friction':
        'The block is sliding across the floor, so the friction is kinetic. Static friction acts only when surfaces are not slipping.',
      spring: NO_SPRING,
    },
    sizeRule: {
      a: 'normal',
      b: 'gravity',
      relation: 'less',
      hint:
        'Size check: the rope pulls partly upward, so the floor doesn’t have to push as hard. The normal force should be a bit shorter than gravity.',
    },
    why: [
      'Vertically the block doesn’t accelerate, so the vertical forces balance: F_N + F_T sin 30° = mg. The rope carries some of the weight, so F_N < mg.',
      'Horizontally the net force is F_T cos 30° − f_k. Kinetic friction points left because the block slides right, no matter which way the rope pulls.',
      'Since f_k = μ_k F_N and F_N is less than mg, friction here is smaller than μ_k mg. That is a common AP trap.',
    ],
  },
  {
    id: 'block-on-incline',
    title: 'Block sliding down an incline',
    summary: 'A block slides down a rough 30° ramp.',
    description:
      'A block slides down a rough incline that makes 30° with the horizontal. Nothing else touches it. Draw every force acting on the block. The dashed axes are tilted to lie along and perpendicular to the slope.',
    object: 'the block',
    shape: 'block',
    axesTilt: -30,
    axesNote: 'Axes along (∥) and perpendicular (⊥) to the slope',
    motion: { kind: 'velocity', angle: 330, label: 'v' },
    expected: [
      {
        type: 'gravity',
        angle: 270,
        source: 'Earth',
        directionHint:
          'Gravity points straight down toward Earth, even on an incline. It is not perpendicular to the slope; only its component is.',
        missingHint: 'Earth still pulls on the block. Which force is that?',
        answerLength: 115,
        answerDirection: 'straight down (not perpendicular to the slope)',
      },
      {
        type: 'normal',
        angle: 60,
        source: 'the incline',
        directionHint:
          'The normal force is perpendicular to the surface that exerts it, pointing away from the surface. On a tilted surface that is not straight up.',
        missingHint: 'The block is pressed against the incline’s surface. What does a surface do when something presses on it?',
        answerLength: 100,
        answerDirection: 'perpendicular to the slope, away from it (60° above the horizontal)',
      },
      {
        type: 'kinetic-friction',
        angle: 150,
        source: 'the incline',
        directionHint:
          'Kinetic friction acts along the surface, opposite to the sliding. The block slides down the slope, so think about which way along the slope friction must point.',
        missingHint: 'The incline is rough and the block is sliding on it. The surface exerts a force along the slope too.',
        answerLength: 55,
        answerDirection: 'up the slope, opposite the sliding',
      },
    ],
    extraHints: {
      applied:
        'Nothing pushes the block down the slope. The “pull down the incline” is just the component mg sin θ of gravity. Draw gravity once, not its components as separate forces.',
      tension: 'No rope or string is attached to the block, so there is no tension.',
      'static-friction':
        'The block is sliding, so the friction is kinetic. Static friction would act only if the block were stuck in place.',
      spring: NO_SPRING,
    },
    sizeRule: {
      a: 'normal',
      b: 'gravity',
      relation: 'less',
      hint:
        'Size check: the normal force only balances the part of gravity perpendicular to the slope (mg cos 30°), so it should be shorter than gravity.',
    },
    why: [
      'Using tilted axes, nothing accelerates perpendicular to the slope, so F_N = mg cos 30°. That’s why the normal force is smaller than the weight.',
      'Along the slope the net force is mg sin 30° − f_k, pointing down the incline if the block is speeding up (or zero if it slides at constant speed).',
      'Only three forces act. mg sin θ and mg cos θ are components of gravity, not extra forces, so they never get their own arrows on a free-body diagram.',
    ],
  },
  {
    id: 'hanging-mass',
    title: 'Mass hanging from a rope',
    summary: 'A mass hangs at rest from a vertical rope.',
    description:
      'A mass hangs at rest from a vertical rope attached to the ceiling. Draw every force acting on the mass.',
    object: 'the mass',
    shape: 'mass',
    axesTilt: 0,
    motion: { kind: 'velocity', angle: 0, label: 'at rest', atRest: true },
    expected: [
      {
        type: 'gravity',
        angle: 270,
        source: 'Earth',
        directionHint: 'Gravity always points straight down, toward the center of Earth.',
        missingHint: 'Earth pulls on the mass. Which force is that?',
        answerLength: 105,
        answerDirection: 'straight down',
      },
      {
        type: 'tension',
        angle: 90,
        source: 'the rope',
        directionHint: 'A rope can only pull, and it pulls along its own length, away from the object. This rope is vertical.',
        missingHint: 'The mass is attached to a rope. What force does the rope exert on it?',
        answerLength: 105,
        answerDirection: 'straight up, along the rope',
      },
    ],
    extraHints: {
      normal:
        'A normal force needs a surface pressing on the object. Nothing is under or beside the mass; it only touches the rope.',
      'kinetic-friction': 'Friction needs a surface in contact with the object. The mass touches only the rope.',
      'static-friction': 'Friction needs a surface in contact with the object. The mass touches only the rope.',
      applied: 'Nothing pushes on the mass. It is touched only by the rope.',
      spring: 'The support is a rope, not a spring. A rope’s pull is called tension.',
    },
    sizeRule: {
      a: 'tension',
      b: 'gravity',
      relation: 'equal',
      hint: 'Size check: the mass is at rest, so the net force is zero. Tension and gravity should be the same length.',
    },
    why: [
      'The mass is at rest, so its acceleration is zero and the net force is zero: F_T = mg.',
      'Tension and gravity are equal and opposite here, but they are not a Newton’s third-law pair. They act on the same object and come from different interactions. Gravity’s partner is the mass pulling Earth upward.',
    ],
  },
  {
    id: 'atwood-machine',
    title: 'Atwood machine',
    summary: 'Two masses on a pulley. Draw the heavier one as it accelerates down.',
    description:
      'Two unequal masses hang from a light string over a frictionless pulley. Once released, the heavier mass accelerates downward. Draw every force acting on the heavier mass only.',
    object: 'the heavier mass',
    shape: 'mass',
    axesTilt: 0,
    motion: { kind: 'accel', angle: 270, label: 'a' },
    expected: [
      {
        type: 'gravity',
        angle: 270,
        source: 'Earth',
        directionHint: 'Gravity always points straight down, toward the center of Earth.',
        missingHint: 'Earth pulls on the heavier mass. Which force is that?',
        answerLength: 120,
        answerDirection: 'straight down',
      },
      {
        type: 'tension',
        angle: 90,
        source: 'the string',
        directionHint:
          'The string pulls along its length, away from the mass. The string above the heavier mass runs straight up to the pulley.',
        missingHint: 'The mass hangs from a string. What does the string do to it?',
        answerLength: 85,
        answerDirection: 'straight up, along the string',
      },
    ],
    extraHints: {
      normal: 'No surface touches the hanging mass, so there is no normal force.',
      'kinetic-friction': 'No surface touches the hanging mass, so there is no friction on it. (The pulley is frictionless too.)',
      'static-friction': 'No surface touches the hanging mass, so there is no friction on it.',
      applied:
        'The other mass never touches this one. Its effect reaches the heavier mass only through the string, as tension. There is no separate push and no “force of motion”.',
      spring: NO_SPRING,
    },
    sizeRule: {
      a: 'tension',
      b: 'gravity',
      relation: 'less',
      hint:
        'Size check: the heavier mass accelerates downward, so the net force on it points down. Tension should be shorter than gravity.',
    },
    why: [
      'The heavier mass accelerates down, so the net force on it points down: mg − F_T = ma. That means F_T is less than this mass’s weight.',
      'The tension is still more than the lighter mass’s weight, because that mass accelerates up. One tension value fits both: F_T = 2m₁m₂g / (m₁ + m₂).',
      'The lighter mass and the pulley never touch the heavier mass. Their only effect shows up through the string’s tension.',
    ],
  },
  {
    id: 'elevator',
    title: 'Person in an elevator',
    summary: 'A person stands in an elevator that accelerates upward.',
    description:
      'A person stands on the floor of an elevator that is accelerating upward. Draw every force acting on the person.',
    object: 'the person',
    shape: 'person',
    axesTilt: 0,
    motion: { kind: 'accel', angle: 90, label: 'a' },
    expected: [
      {
        type: 'gravity',
        angle: 270,
        source: 'Earth',
        directionHint: 'Gravity always points straight down, toward the center of Earth.',
        missingHint: 'Earth pulls on the person. Which force is that?',
        answerLength: 95,
        answerDirection: 'straight down',
      },
      {
        type: 'normal',
        angle: 90,
        source: 'the elevator floor',
        directionHint: 'The floor pushes perpendicular to itself, away from the floor. The elevator floor is level.',
        missingHint: 'The person stands on the elevator floor. What does the floor do?',
        answerLength: 130,
        answerDirection: 'straight up',
      },
    ],
    extraHints: {
      tension:
        'The cable pulls on the elevator car, not on the person. A free-body diagram shows only forces that act directly on the chosen object.',
      applied:
        'Nothing pushes the person except the floor (that’s the normal force). Acceleration is not a force, and there’s no “force of motion”.',
      'kinetic-friction': 'Nothing is sliding and nothing pushes the person sideways, so there is no friction.',
      'static-friction': 'Nothing pushes the person sideways, so the floor has no reason to exert friction.',
      spring: NO_SPRING,
    },
    sizeRule: {
      a: 'normal',
      b: 'gravity',
      relation: 'greater',
      hint:
        'Size check: the elevator accelerates upward, so the net force on the person points up. The normal force should be longer than gravity.',
    },
    why: [
      'The person accelerates upward, so the net force points up: F_N − mg = ma, which gives F_N = m(g + a). The floor pushes harder than the person’s weight, which is why you feel heavier.',
      'Gravity itself doesn’t change. Only the normal force changes with the elevator’s acceleration.',
      'What matters is acceleration, not velocity: an elevator moving down while slowing to a stop also has upward acceleration, and the same diagram.',
    ],
  },
]

export function getScenario(id: string | null): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id)
}
