import type { Problem } from '@/types/problem'

// Original practice problems for units 1-3 (kinematics, Newton's laws, work/energy/power).
// Every numeric answer was computed with a script and rounded to 3-4 significant figures.
export const problemsUnits1to3: Problem[] = [
  // ───────────────────────────── Kinematics ─────────────────────────────
  {
    id: 'kin-01',
    unit: 'kinematics',
    difficulty: 'starter',
    title: 'Ball thrown up from a rooftop',
    statement:
      'A ball is thrown straight up at 15.0 m/s from the edge of a flat roof 20.0 m above the ground. On the way down it misses the roof and falls to the ground beside the building. Take up as positive and ignore air resistance.',
    parts: [
      {
        id: 'a',
        prompt: 'What is the maximum height of the ball above the ground?',
        answer: { kind: 'numeric', value: 31.48, unit: 'm', tolerancePct: 2 },
        hint: 'At the highest point the vertical velocity is momentarily zero.',
        solution: [
          { title: 'Use the top of the flight', body: 'At maximum height v = 0. Use v² = v₀² − 2gΔy with v₀ = 15.0 m/s.' },
          { title: 'Solve for the rise above the roof', body: 'Δy = v₀² / (2g) = 15.0² / (2 · 9.8) = 225 / 19.6 ≈ 11.48 m.' },
          { title: 'Add the roof height', body: 'h_max = 20.0 m + 11.48 m ≈ 31.48 m above the ground.' },
        ],
      },
      {
        id: 'b',
        prompt: 'How long after it is thrown does the ball hit the ground?',
        answer: { kind: 'numeric', value: 4.065, unit: 's', tolerancePct: 2 },
        hint: 'Measured from the launch point, the ground is at y = −20.0 m. You will get a quadratic in t.',
        solution: [
          { title: 'Write the position equation', body: 'y(t) = v₀t − ½gt² with the origin at the launch point. The ground is at y = −20.0 m.' },
          { title: 'Set up the quadratic', body: '−20.0 = 15.0t − 4.9t²  →  4.9t² − 15.0t − 20.0 = 0.' },
          { title: 'Apply the quadratic formula', body: 't = [15.0 + √(15.0² + 4 · 4.9 · 20.0)] / (2 · 4.9) = (15.0 + √617) / 9.8 = (15.0 + 24.84) / 9.8.' },
          { title: 'Keep the positive root', body: 't ≈ 39.84 / 9.8 ≈ 4.065 s. The negative root is before the throw and is not physical.' },
        ],
      },
      {
        id: 'c',
        prompt: 'What is the speed of the ball just before it hits the ground?',
        answer: { kind: 'numeric', value: 24.84, unit: 'm/s', tolerancePct: 2 },
        hint: 'You do not need the time: relate velocity and displacement directly.',
        solution: [
          { title: 'Choose the time-free equation', body: 'v² = v₀² − 2gΔy, with Δy = −20.0 m (the ball ends up below the launch point).' },
          { title: 'Substitute', body: 'v² = 15.0² − 2 · 9.8 · (−20.0) = 225 + 392 = 617 m²/s².' },
          { title: 'Take the square root', body: '|v| = √617 ≈ 24.84 m/s, directed downward.' },
        ],
      },
    ],
    tags: ['free fall', 'quadratic', 'vertical motion'],
    free: true,
    simulator: { tool: 'motion', preset: 'free-fall' },
  },
  {
    id: 'kin-02',
    unit: 'kinematics',
    difficulty: 'intermediate',
    title: 'Reading motion from a cubic x(t)',
    statement:
      'A particle moves along the x-axis with position x(t) = 2t³ − 9t² + 12t + 1, where x is in meters and t is in seconds (t ≥ 0). Positive values point in the +x direction.',
    parts: [
      {
        id: 'a',
        prompt: 'What is the velocity of the particle at t = 3.0 s?',
        answer: { kind: 'numeric', value: 12, unit: 'm/s', tolerancePct: 2 },
        hint: 'Velocity is the time derivative of position.',
        solution: [
          { title: 'Differentiate x(t)', body: 'v(t) = dx/dt = 6t² − 18t + 12.' },
          { title: 'Evaluate at t = 3.0 s', body: 'v(3) = 6 · 9 − 18 · 3 + 12 = 54 − 54 + 12 = 12 m/s.' },
          { title: 'Interpret', body: 'The value is positive, so the particle moves in the +x direction at 12 m/s.' },
        ],
      },
      {
        id: 'b',
        prompt: 'What is the acceleration of the particle at t = 0.50 s? Give a signed value.',
        answer: { kind: 'numeric', value: -12, unit: 'm/s²', tolerancePct: 2 },
        hint: 'Differentiate once more.',
        solution: [
          { title: 'Differentiate v(t)', body: 'a(t) = dv/dt = 12t − 18.' },
          { title: 'Evaluate at t = 0.50 s', body: 'a(0.50) = 12 · 0.50 − 18 = 6 − 18 = −12 m/s².' },
          { title: 'Interpret the sign', body: 'The acceleration points in the −x direction at that instant.' },
        ],
      },
      {
        id: 'c',
        prompt: 'Which statement best describes the motion during the interval 1 s < t < 2 s?',
        answer: {
          kind: 'choice',
          options: [
            'It moves in the +x direction the whole time and speeds up.',
            'It moves in the −x direction the whole time, first speeding up and then slowing down.',
            'It moves in the −x direction the whole time, first slowing down and then speeding up.',
            'It is at rest, because the velocity is zero at both t = 1 s and t = 2 s.',
          ],
          correctIndex: 1,
        },
        hint: 'Factor v(t). Then compare the signs of v and a on each side of the time where a = 0.',
        solution: [
          { title: 'Factor the velocity', body: 'v(t) = 6(t − 1)(t − 2). For 1 < t < 2 one factor is positive and one is negative, so v < 0: the particle moves in −x throughout.' },
          { title: 'Find where a changes sign', body: 'a(t) = 12t − 18 = 0 at t = 1.5 s. Before 1.5 s, a < 0; after 1.5 s, a > 0.' },
          { title: 'Compare signs', body: 'From 1 s to 1.5 s, v and a are both negative, so the speed increases. From 1.5 s to 2 s, v < 0 but a > 0, so the speed decreases.' },
          { title: 'Conclusion', body: 'It moves in −x the whole time, speeding up and then slowing down. Zero velocity at the endpoints does not mean it is at rest in between.' },
        ],
      },
    ],
    tags: ['derivatives', 'speeding up', 'position function'],
    free: true,
  },
  {
    id: 'kin-03',
    unit: 'kinematics',
    difficulty: 'intermediate',
    title: 'Displacement versus distance',
    statement:
      'A particle moves along the x-axis with velocity v(t) = 3t² − 12t + 9, where v is in m/s and t is in seconds. At t = 0 the particle is at x = 2.0 m.',
    parts: [
      {
        id: 'a',
        prompt: 'What is the position of the particle at t = 4.0 s?',
        answer: { kind: 'numeric', value: 6, unit: 'm', tolerancePct: 2 },
        hint: 'Integrate the velocity to get the displacement, then add the starting position.',
        solution: [
          { title: 'Integrate the velocity', body: 'Δx = ∫₀⁴ (3t² − 12t + 9) dt = [t³ − 6t² + 9t] from 0 to 4.' },
          { title: 'Evaluate', body: 'Δx = 64 − 96 + 36 − 0 = 4.0 m.' },
          { title: 'Add the initial position', body: 'x(4) = 2.0 m + 4.0 m = 6.0 m.' },
        ],
      },
      {
        id: 'b',
        prompt: 'What total distance does the particle travel between t = 0 and t = 4.0 s?',
        answer: { kind: 'numeric', value: 12, unit: 'm', tolerancePct: 2 },
        hint: 'Find when the particle turns around (v = 0) and add the size of each leg separately.',
        solution: [
          { title: 'Find the turning points', body: 'v(t) = 3(t − 1)(t − 3) = 0 at t = 1 s and t = 3 s. The velocity is positive on (0, 1), negative on (1, 3) and positive on (3, 4).' },
          { title: 'Position at each key time', body: 'Using x(t) = 2 + t³ − 6t² + 9t: x(0) = 2 m, x(1) = 6 m, x(3) = 2 m, x(4) = 6 m.' },
          { title: 'Add the legs', body: 'Distance = |6 − 2| + |2 − 6| + |6 − 2| = 4 + 4 + 4 = 12 m.' },
          { title: 'Compare', body: 'The displacement is only 4.0 m, but the distance is 12 m because the particle reverses twice. Distance is ∫|v| dt, not ∫v dt.' },
        ],
      },
    ],
    tags: ['integrals', 'distance', 'displacement'],
    free: true,
  },
  {
    id: 'kin-04',
    unit: 'kinematics',
    difficulty: 'intermediate',
    title: 'Projectile hits a wall',
    statement:
      'A ball is launched from level ground at 25.0 m/s at 40.0° above the horizontal, directly toward a tall vertical wall whose base is 30.0 m away. Ignore air resistance. Take up as positive for vertical quantities.',
    parts: [
      {
        id: 'a',
        prompt: 'How long after launch does the ball reach the wall?',
        answer: { kind: 'numeric', value: 1.566, unit: 's', tolerancePct: 2 },
        hint: 'Horizontal velocity is constant.',
        solution: [
          { title: 'Horizontal velocity', body: 'vₓ = v₀ cos θ = 25.0 · cos 40.0° ≈ 19.15 m/s, constant during the flight.' },
          { title: 'Time to cover 30.0 m', body: 't = Δx / vₓ = 30.0 / 19.15 ≈ 1.566 s.' },
          { title: 'Check it gets there', body: 'The level-ground range would be v₀² sin 2θ / g ≈ 62.8 m, so the ball is still in the air at 30.0 m.' },
        ],
      },
      {
        id: 'b',
        prompt: 'At what height above the ground does the ball strike the wall?',
        answer: { kind: 'numeric', value: 13.15, unit: 'm', tolerancePct: 2 },
        hint: 'Use the time from part (a) in the vertical position equation.',
        solution: [
          { title: 'Vertical launch velocity', body: 'v₀ᵧ = v₀ sin θ = 25.0 · sin 40.0° ≈ 16.07 m/s.' },
          { title: 'Vertical position equation', body: 'y = v₀ᵧt − ½gt² with t ≈ 1.566 s.' },
          { title: 'Evaluate', body: 'y ≈ 16.07 · 1.566 − 4.9 · (1.566)² ≈ 25.17 − 12.02 ≈ 13.15 m.' },
        ],
      },
      {
        id: 'c',
        prompt: 'At the moment it hits the wall, the ball is:',
        answer: {
          kind: 'choice',
          options: [
            'still rising, because its vertical velocity is still upward',
            'exactly at the top of its path',
            'falling, because more than half its flight time has passed',
            'falling, because gravity has been pulling it down the whole time',
          ],
          correctIndex: 0,
        },
        hint: 'Find vᵧ at the impact time and look at its sign.',
        solution: [
          { title: 'Vertical velocity at impact', body: 'vᵧ = v₀ᵧ − gt ≈ 16.07 − 9.8 · 1.566 ≈ 16.07 − 15.35 ≈ +0.72 m/s.' },
          { title: 'Read the sign', body: 'vᵧ is positive (upward), so the ball is still rising, just before the top of its path.' },
          { title: 'Cross-check', body: 'The time to the top is v₀ᵧ / g ≈ 1.640 s, which is later than 1.566 s.' },
        ],
      },
    ],
    tags: ['projectile', '2d motion', 'components'],
    free: true,
    simulator: { tool: 'motion', preset: 'projectile' },
  },
  {
    id: 'kin-05',
    unit: 'kinematics',
    difficulty: 'advanced',
    title: 'Coasting boat with linear drag',
    statement:
      'A small boat moving in a straight line at 12.0 m/s cuts its engine at t = 0. After that, the water gives it an acceleration a = −kv, where v is the velocity and k = 0.40 s⁻¹. Take the boat’s direction of motion as positive.',
    parts: [
      {
        id: 'a',
        prompt: 'What is the boat’s speed at t = 3.0 s?',
        answer: { kind: 'numeric', value: 3.614, unit: 'm/s', tolerancePct: 2 },
        hint: 'Write dv/dt = −kv, separate the variables and integrate.',
        solution: [
          { title: 'Separate variables', body: 'dv/dt = −kv  →  dv/v = −k dt.' },
          { title: 'Integrate', body: '∫ from v₀ to v of dv′/v′ = −k∫₀ᵗ dt′  →  ln(v/v₀) = −kt  →  v(t) = v₀e^(−kt).' },
          { title: 'Evaluate at t = 3.0 s', body: 'v = 12.0 · e^(−0.40 · 3.0) = 12.0 · e^(−1.2) ≈ 12.0 · 0.3012 ≈ 3.614 m/s.' },
        ],
      },
      {
        id: 'b',
        prompt: 'If the boat coasts forever, what total distance does it travel after the engine is cut?',
        answer: { kind: 'numeric', value: 30, unit: 'm', tolerancePct: 2 },
        hint: 'Integrate v(t) from 0 to infinity.',
        solution: [
          { title: 'Set up the integral', body: 'x_total = ∫₀^∞ v₀e^(−kt) dt.' },
          { title: 'Integrate', body: '∫₀^∞ e^(−kt) dt = 1/k, so x_total = v₀/k.' },
          { title: 'Substitute', body: 'x_total = 12.0 / 0.40 = 30 m. The speed never reaches zero, but the distance converges.' },
        ],
      },
      {
        id: 'c',
        prompt: 'How long after the engine is cut does the boat slow to 1.0 m/s?',
        answer: { kind: 'numeric', value: 6.212, unit: 's', tolerancePct: 2 },
        solution: [
          { title: 'Use the velocity function', body: '1.0 = 12.0 · e^(−0.40t).' },
          { title: 'Take the natural log', body: 'e^(−0.40t) = 1/12  →  0.40t = ln 12 ≈ 2.485.' },
          { title: 'Solve', body: 't = 2.485 / 0.40 ≈ 6.212 s.' },
        ],
      },
    ],
    tags: ['differential equations', 'drag', 'exponential decay'],
    free: false,
  },
  {
    id: 'kin-06',
    unit: 'kinematics',
    difficulty: 'advanced',
    title: 'Acceleration that depends on position',
    statement:
      'A particle moves along the x-axis with acceleration a(x) = 3x², where a is in m/s² and x is in meters. At x = 1.0 m the particle is moving in the +x direction at 2.0 m/s.',
    parts: [
      {
        id: 'a',
        prompt: 'What is the particle’s speed when it reaches x = 3.0 m?',
        answer: { kind: 'numeric', value: 7.483, unit: 'm/s', tolerancePct: 2 },
        hint: 'Use the chain rule: a = dv/dt = (dv/dx)(dx/dt) = v dv/dx.',
        solution: [
          { title: 'Rewrite the acceleration', body: 'a = v dv/dx, so v dv = a(x) dx = 3x² dx.' },
          { title: 'Integrate both sides', body: '∫ from 2.0 to v of v′ dv′ = ∫ from 1.0 to x of 3x′² dx′  →  ½(v² − 4) = x³ − 1.' },
          { title: 'Solve for v²', body: 'v² = 4 + 2(x³ − 1). At x = 3.0 m: v² = 4 + 2(27 − 1) = 56 m²/s².' },
          { title: 'Take the square root', body: 'v = √56 ≈ 7.483 m/s.' },
        ],
      },
      {
        id: 'b',
        prompt: 'At what position does the particle’s speed reach 10.0 m/s?',
        answer: { kind: 'numeric', value: 3.659, unit: 'm', tolerancePct: 2 },
        hint: 'Use the v²(x) relation from part (a) and solve for x.',
        solution: [
          { title: 'Start from v²(x)', body: 'v² = 4 + 2(x³ − 1) = 2x³ + 2.' },
          { title: 'Set v = 10.0 m/s', body: '100 = 2x³ + 2  →  x³ = 49.' },
          { title: 'Take the cube root', body: 'x = ∛49 ≈ 3.659 m.' },
        ],
      },
    ],
    tags: ['chain rule', 'integrals', 'variable acceleration'],
    free: false,
  },

  // ─────────────────────────── Newton's laws ───────────────────────────
  {
    id: 'nl-01',
    unit: 'newtons-laws',
    difficulty: 'starter',
    title: 'Pulling a block with an angled rope',
    statement:
      'A 5.0 kg block rests on a horizontal floor. A rope pulls on it with a 30 N force directed 30° above the horizontal. The coefficient of kinetic friction between the block and the floor is 0.20, and the block slides along the floor.',
    parts: [
      {
        id: 'a',
        prompt: 'What is the normal force exerted by the floor on the block?',
        answer: { kind: 'numeric', value: 34, unit: 'N', tolerancePct: 2 },
        hint: 'The upward part of the rope force carries some of the weight.',
        solution: [
          { title: 'Draw the forces', body: 'Weight mg down, normal force N up, rope tension T at 30° above horizontal, kinetic friction backward.' },
          { title: 'Vertical balance', body: 'The block does not accelerate vertically: N + T sin 30° − mg = 0.' },
          { title: 'Solve', body: 'N = mg − T sin 30° = 5.0 · 9.8 − 30 · 0.5 = 49 − 15 = 34 N.' },
        ],
      },
      {
        id: 'b',
        prompt: 'What is the acceleration of the block?',
        answer: { kind: 'numeric', value: 3.836, unit: 'm/s²', tolerancePct: 2 },
        hint: 'Friction is μₖ times the normal force you found, not μₖ times mg.',
        solution: [
          { title: 'Friction force', body: 'fₖ = μₖN = 0.20 · 34 = 6.8 N, opposite the motion.' },
          { title: 'Horizontal rope component', body: 'T cos 30° = 30 · 0.866 ≈ 25.98 N.' },
          { title: 'Newton’s second law horizontally', body: 'ma = T cos 30° − fₖ  →  a = (25.98 − 6.8) / 5.0 ≈ 3.836 m/s².' },
        ],
      },
    ],
    tags: ['friction', 'free-body diagram', 'components'],
    free: true,
    simulator: { tool: 'fbd', preset: 'block-on-floor-pulled' },
  },
  {
    id: 'nl-02',
    unit: 'newtons-laws',
    difficulty: 'starter',
    title: 'Sliding down a rough incline',
    statement:
      'A 2.0 kg block is released from rest on a ramp inclined at 25° above the horizontal. The coefficient of kinetic friction between the block and the ramp is 0.15. The block slides down the ramp.',
    parts: [
      {
        id: 'a',
        prompt: 'What is the magnitude of the block’s acceleration down the ramp?',
        answer: { kind: 'numeric', value: 2.809, unit: 'm/s²', tolerancePct: 2 },
        hint: 'Tilt your axes so x points down the ramp. The normal force is mg cos θ.',
        solution: [
          { title: 'Choose axes', body: 'Take +x down the slope and +y perpendicular to it, away from the surface.' },
          { title: 'Normal force and friction', body: 'N = mg cos 25°, so fₖ = μₖmg cos 25°, pointing up the slope.' },
          { title: 'Second law along the slope', body: 'ma = mg sin 25° − μₖmg cos 25°  →  a = g(sin 25° − μₖ cos 25°).' },
          { title: 'Evaluate', body: 'a = 9.8 · (0.4226 − 0.15 · 0.9063) = 9.8 · 0.2867 ≈ 2.809 m/s². The mass cancels.' },
        ],
      },
      {
        id: 'b',
        prompt: 'What is the block’s speed after it has slid 3.0 m along the ramp?',
        answer: { kind: 'numeric', value: 4.106, unit: 'm/s', tolerancePct: 2 },
        solution: [
          { title: 'Constant acceleration', body: 'The acceleration from part (a) is constant, so v² = v₀² + 2aΔx with v₀ = 0.' },
          { title: 'Substitute', body: 'v² = 2 · 2.809 · 3.0 ≈ 16.86 m²/s².' },
          { title: 'Take the square root', body: 'v ≈ 4.106 m/s.' },
        ],
      },
    ],
    tags: ['incline', 'friction', 'free-body diagram'],
    free: true,
    simulator: { tool: 'fbd', preset: 'block-on-incline' },
  },
  {
    id: 'nl-03',
    unit: 'newtons-laws',
    difficulty: 'intermediate',
    title: 'Atwood machine',
    statement:
      'Two blocks, of mass 3.0 kg and 5.0 kg, hang from opposite ends of a light string that passes over a massless, frictionless pulley. The system is released from rest.',
    parts: [
      {
        id: 'a',
        prompt: 'What is the magnitude of the acceleration of each block?',
        answer: { kind: 'numeric', value: 2.45, unit: 'm/s²', tolerancePct: 2 },
        hint: 'Write Newton’s second law for each block, with each block’s positive direction along its own motion.',
        solution: [
          { title: 'Sign convention', body: 'The 5.0 kg block moves down and the 3.0 kg block moves up. Take each block’s direction of motion as positive.' },
          { title: 'Second law for each block', body: '5.0 kg: m₂g − T = m₂a.  3.0 kg: T − m₁g = m₁a.' },
          { title: 'Add the equations', body: '(m₂ − m₁)g = (m₁ + m₂)a  →  a = (5.0 − 3.0) · 9.8 / 8.0.' },
          { title: 'Evaluate', body: 'a = 19.6 / 8.0 = 2.45 m/s².' },
        ],
      },
      {
        id: 'b',
        prompt: 'What is the tension in the string?',
        answer: { kind: 'numeric', value: 36.75, unit: 'N', tolerancePct: 2 },
        solution: [
          { title: 'Use the lighter block', body: 'T − m₁g = m₁a  →  T = m₁(g + a).' },
          { title: 'Substitute', body: 'T = 3.0 · (9.8 + 2.45) = 3.0 · 12.25 = 36.75 N.' },
          { title: 'Check with the heavier block', body: 'T = m₂(g − a) = 5.0 · 7.35 = 36.75 N. Both agree.' },
        ],
      },
      {
        id: 'c',
        prompt: 'How does the string tension compare with the weights of the two blocks?',
        answer: {
          kind: 'choice',
          options: [
            'It equals the weight of the 5.0 kg block.',
            'It equals the weight of the 3.0 kg block.',
            'It is greater than the weight of the 3.0 kg block but less than the weight of the 5.0 kg block.',
            'It equals the combined weight of both blocks.',
          ],
          correctIndex: 2,
        },
        hint: 'Which block has a net force pointing up, and which has a net force pointing down?',
        solution: [
          { title: 'Lighter block', body: 'It accelerates upward, so the net force on it is up: T > m₁g = 29.4 N.' },
          { title: 'Heavier block', body: 'It accelerates downward, so the net force on it is down: T < m₂g = 49 N.' },
          { title: 'Conclusion', body: 'T = 36.75 N lies between the two weights.' },
        ],
      },
    ],
    tags: ['atwood', 'tension', 'systems'],
    free: true,
    simulator: { tool: 'motion', preset: 'atwood' },
  },
  {
    id: 'nl-04',
    unit: 'newtons-laws',
    difficulty: 'intermediate',
    title: 'Scale reading in an elevator',
    statement:
      'A 60 kg student stands on a bathroom scale in an elevator. For 0 ≤ t ≤ 4.0 s the elevator’s vertical velocity is v(t) = 2.0t − 0.50t², with v in m/s, t in seconds, and up taken as positive. The scale reads the normal force it exerts on the student.',
    parts: [
      {
        id: 'a',
        prompt: 'What does the scale read at t = 1.0 s?',
        answer: { kind: 'numeric', value: 648, unit: 'N', tolerancePct: 2 },
        hint: 'Differentiate v(t) to get the acceleration, then apply ΣF = ma to the student.',
        solution: [
          { title: 'Acceleration function', body: 'a(t) = dv/dt = 2.0 − 1.0t (m/s²).' },
          { title: 'Acceleration at t = 1.0 s', body: 'a(1.0) = 2.0 − 1.0 = +1.0 m/s² (upward).' },
          { title: 'Second law for the student', body: 'N − mg = ma  →  N = m(g + a).' },
          { title: 'Evaluate', body: 'N = 60 · (9.8 + 1.0) = 648 N.' },
        ],
      },
      {
        id: 'b',
        prompt: 'What does the scale read at t = 3.0 s?',
        answer: { kind: 'numeric', value: 528, unit: 'N', tolerancePct: 2 },
        solution: [
          { title: 'Acceleration at t = 3.0 s', body: 'a(3.0) = 2.0 − 3.0 = −1.0 m/s² (downward), even though the elevator is still moving up (v(3.0) = 1.5 m/s).' },
          { title: 'Apply N = m(g + a)', body: 'N = 60 · (9.8 − 1.0) = 60 · 8.8 = 528 N.' },
          { title: 'Interpret', body: 'The student feels lighter because the elevator is slowing down while moving up.' },
        ],
      },
      {
        id: 'c',
        prompt: 'At what time does the scale read exactly the student’s weight (588 N)?',
        answer: {
          kind: 'choice',
          options: ['t = 0 s', 't = 2.0 s', 't = 4.0 s', 'At no time in this interval'],
          correctIndex: 1,
        },
        hint: 'The scale reads mg when the acceleration is zero, not when the velocity is zero.',
        solution: [
          { title: 'Condition', body: 'N = mg requires a = 0.' },
          { title: 'Solve a(t) = 0', body: '2.0 − 1.0t = 0  →  t = 2.0 s. This is when the elevator moves fastest (v = 2.0 m/s).' },
          { title: 'Check the distractors', body: 'At t = 0 and t = 4.0 s the velocity is zero, but a = +2.0 and −2.0 m/s², so the reading is not mg.' },
        ],
      },
    ],
    tags: ['apparent weight', 'elevator', 'derivatives'],
    free: false,
    simulator: { tool: 'fbd', preset: 'elevator' },
  },
  {
    id: 'nl-05',
    unit: 'newtons-laws',
    difficulty: 'advanced',
    title: 'Falling with linear air drag',
    statement:
      'A 0.50 kg object is released from rest and falls vertically. Air exerts a drag force of magnitude bv opposite its velocity, where b = 0.20 kg/s and v is the speed. Take down as positive.',
    parts: [
      {
        id: 'a',
        prompt: 'What is the terminal speed of the object?',
        answer: { kind: 'numeric', value: 24.5, unit: 'm/s', tolerancePct: 2 },
        hint: 'At terminal speed the net force is zero.',
        solution: [
          { title: 'Second law', body: 'm dv/dt = mg − bv.' },
          { title: 'Terminal condition', body: 'Terminal speed is reached when dv/dt = 0, so mg = bv_T.' },
          { title: 'Solve', body: 'v_T = mg / b = 0.50 · 9.8 / 0.20 = 24.5 m/s.' },
        ],
      },
      {
        id: 'b',
        prompt: 'How long after release does the object reach 90% of its terminal speed?',
        answer: { kind: 'numeric', value: 5.756, unit: 's', tolerancePct: 2 },
        hint: 'Solve the differential equation to get v(t) = v_T(1 − e^(−t/τ)) with τ = m/b.',
        solution: [
          { title: 'Separate variables', body: 'dv / (v_T − v) = (b/m) dt. Integrating from v = 0 at t = 0 gives −ln(1 − v/v_T) = t/τ, with τ = m/b.' },
          { title: 'Velocity function', body: 'v(t) = v_T(1 − e^(−t/τ)), where τ = 0.50 / 0.20 = 2.5 s.' },
          { title: 'Set v = 0.90 v_T', body: '1 − e^(−t/τ) = 0.90  →  e^(−t/τ) = 0.10  →  t = τ ln 10.' },
          { title: 'Evaluate', body: 't = 2.5 · 2.303 ≈ 5.756 s.' },
        ],
      },
      {
        id: 'c',
        prompt: 'How far has the object fallen at that moment?',
        answer: { kind: 'numeric', value: 85.91, unit: 'm', tolerancePct: 2 },
        hint: 'Integrate v(t) from 0 to the time found in part (b).',
        solution: [
          { title: 'Integrate the velocity', body: 'y(t) = ∫₀ᵗ v_T(1 − e^(−t′/τ)) dt′ = v_T[t − τ(1 − e^(−t/τ))].' },
          { title: 'Use e^(−t/τ) = 0.10', body: 'y = 24.5 · [5.756 − 2.5 · (1 − 0.10)] = 24.5 · (5.756 − 2.25).' },
          { title: 'Evaluate', body: 'y = 24.5 · 3.506 ≈ 85.91 m.' },
        ],
      },
    ],
    tags: ['drag', 'terminal velocity', 'differential equations'],
    free: false,
  },

  // ─────────────────────── Work, energy and power ───────────────────────
  {
    id: 'wep-01',
    unit: 'work-energy-power',
    difficulty: 'starter',
    title: 'Work done by a variable force',
    statement:
      'A force along the x-axis has magnitude F(x) = 4x + 3x², where F is in newtons and x is in meters, and it always points in the +x direction. It acts on a 2.0 kg object that starts from rest at x = 0 on a frictionless horizontal surface.',
    parts: [
      {
        id: 'a',
        prompt: 'How much work does the force do as the object moves from x = 0 to x = 2.0 m?',
        answer: { kind: 'numeric', value: 16, unit: 'J', tolerancePct: 2 },
        hint: 'For a variable force, W = ∫F dx.',
        solution: [
          { title: 'Set up the integral', body: 'W = ∫₀² (4x + 3x²) dx.' },
          { title: 'Antiderivative', body: '∫(4x + 3x²) dx = 2x² + x³.' },
          { title: 'Evaluate', body: 'W = (2 · 4 + 8) − 0 = 16 J.' },
        ],
      },
      {
        id: 'b',
        prompt: 'What is the object’s speed at x = 2.0 m?',
        answer: { kind: 'numeric', value: 4, unit: 'm/s', tolerancePct: 2 },
        hint: 'This is the only force doing work, so use the work-energy theorem.',
        solution: [
          { title: 'Work-energy theorem', body: 'W_net = ΔK = ½mv² − 0.' },
          { title: 'Substitute', body: '16 = ½ · 2.0 · v²  →  v² = 16 m²/s².' },
          { title: 'Solve', body: 'v = 4.0 m/s.' },
        ],
      },
    ],
    tags: ['work integral', 'work-energy theorem', 'variable force'],
    free: true,
  },
  {
    id: 'wep-02',
    unit: 'work-energy-power',
    difficulty: 'starter',
    title: 'Spring launcher and ramp',
    statement:
      'A 0.25 kg block is pushed against a horizontal spring (k = 400 N/m), compressing it by 0.15 m, and released from rest. The block leaves the spring, slides across a frictionless floor and then up a frictionless ramp.',
    parts: [
      {
        id: 'a',
        prompt: 'What is the block’s speed after it leaves the spring?',
        answer: { kind: 'numeric', value: 6, unit: 'm/s', tolerancePct: 2 },
        hint: 'All of the spring’s stored energy becomes kinetic energy.',
        solution: [
          { title: 'Energy conservation', body: '½kx² = ½mv², because there is no friction.' },
          { title: 'Solve for v', body: 'v = x√(k/m) = 0.15 · √(400 / 0.25) = 0.15 · √1600.' },
          { title: 'Evaluate', body: 'v = 0.15 · 40 = 6.0 m/s.' },
        ],
      },
      {
        id: 'b',
        prompt: 'What maximum height above the floor does the block reach on the ramp?',
        answer: { kind: 'numeric', value: 1.837, unit: 'm', tolerancePct: 2 },
        hint: 'At its highest point the block is momentarily at rest.',
        solution: [
          { title: 'Energy conservation', body: '½mv² = mgh. The mass cancels.' },
          { title: 'Solve for h', body: 'h = v² / (2g) = 36 / 19.6.' },
          { title: 'Evaluate', body: 'h ≈ 1.837 m. The ramp angle does not matter because the ramp is frictionless.' },
        ],
      },
    ],
    tags: ['spring', 'energy conservation'],
    free: true,
    simulator: { tool: 'motion', preset: 'spring' },
  },
  {
    id: 'wep-03',
    unit: 'work-energy-power',
    difficulty: 'intermediate',
    title: 'Force and equilibrium from U(x)',
    statement:
      'A 0.50 kg particle moves along the x-axis. The only force on it is conservative, with potential energy U(x) = 2x³ − 6x, where U is in joules and x is in meters.',
    parts: [
      {
        id: 'a',
        prompt: 'What is the force on the particle at x = 2.0 m? Give a signed value (positive means +x).',
        answer: { kind: 'numeric', value: -18, unit: 'N', tolerancePct: 2 },
        hint: 'F(x) = −dU/dx.',
        solution: [
          { title: 'Differentiate U', body: 'dU/dx = 6x² − 6.' },
          { title: 'Force function', body: 'F(x) = −dU/dx = 6 − 6x².' },
          { title: 'Evaluate at x = 2.0 m', body: 'F(2.0) = 6 − 24 = −18 N, pointing in the −x direction.' },
        ],
      },
      {
        id: 'b',
        prompt: 'Which statement correctly describes the equilibrium positions?',
        answer: {
          kind: 'choice',
          options: [
            'x = +1 m is stable and x = −1 m is unstable.',
            'x = +1 m is unstable and x = −1 m is stable.',
            'Both x = +1 m and x = −1 m are stable.',
            'The only equilibrium is at x = 0, where U = 0.',
          ],
          correctIndex: 0,
        },
        hint: 'Equilibrium means F = 0. A stable equilibrium sits at a minimum of U.',
        solution: [
          { title: 'Find equilibria', body: 'F = 6 − 6x² = 0  →  x = ±1 m.' },
          { title: 'Second derivative test', body: 'd²U/dx² = 12x. At x = +1 m it is +12 > 0 (a minimum of U). At x = −1 m it is −12 < 0 (a maximum).' },
          { title: 'Conclusion', body: 'x = +1 m is stable and x = −1 m is unstable. U = 0 at x = 0 does not make it an equilibrium: F(0) = 6 N.' },
        ],
      },
      {
        id: 'c',
        prompt: 'The particle passes x = 0 moving in the +x direction at 2.0 m/s. What is its speed at x = 1.0 m?',
        answer: { kind: 'numeric', value: 4.472, unit: 'm/s', tolerancePct: 2 },
        hint: 'Mechanical energy K + U is conserved.',
        solution: [
          { title: 'Energy at x = 0', body: 'K = ½ · 0.50 · 2.0² = 1.0 J and U(0) = 0, so E = 1.0 J.' },
          { title: 'Potential energy at x = 1.0 m', body: 'U(1) = 2 − 6 = −4.0 J.' },
          { title: 'Kinetic energy at x = 1.0 m', body: 'K = E − U = 1.0 − (−4.0) = 5.0 J.' },
          { title: 'Solve for v', body: 'v = √(2K/m) = √(2 · 5.0 / 0.50) = √20 ≈ 4.472 m/s.' },
        ],
      },
    ],
    tags: ['potential energy', 'equilibrium', 'conservative force'],
    free: true,
  },
  {
    id: 'wep-04',
    unit: 'work-energy-power',
    difficulty: 'intermediate',
    title: 'Accelerating at constant power',
    statement:
      'A 1200 kg car starts from rest on a level road. Its engine delivers a constant power of 30.0 kW to the car’s motion. Ignore friction and air resistance (an idealized model).',
    parts: [
      {
        id: 'a',
        prompt: 'What is the car’s speed 6.0 s after it starts?',
        answer: { kind: 'numeric', value: 17.32, unit: 'm/s', tolerancePct: 2 },
        hint: 'With constant power, the work done in time t is Pt.',
        solution: [
          { title: 'Work done by the engine', body: 'W = Pt = 30 000 · 6.0 = 180 000 J.' },
          { title: 'Work-energy theorem', body: 'Pt = ½mv²  →  v = √(2Pt/m).' },
          { title: 'Evaluate', body: 'v = √(2 · 180 000 / 1200) = √300 ≈ 17.32 m/s.' },
        ],
      },
      {
        id: 'b',
        prompt: 'What is the car’s acceleration at that instant?',
        answer: { kind: 'numeric', value: 1.443, unit: 'm/s²', tolerancePct: 2 },
        hint: 'Power equals force times velocity.',
        solution: [
          { title: 'Force from power', body: 'P = Fv, so F = P/v.' },
          { title: 'Newton’s second law', body: 'a = F/m = P/(mv).' },
          { title: 'Evaluate', body: 'a = 30 000 / (1200 · 17.32) ≈ 1.443 m/s². The acceleration drops as the car speeds up.' },
        ],
      },
      {
        id: 'c',
        prompt: 'How far does the car travel during those first 6.0 s?',
        answer: { kind: 'numeric', value: 69.28, unit: 'm', tolerancePct: 2 },
        hint: 'Write v(t) = √(2P/m) · t^(1/2) and integrate.',
        solution: [
          { title: 'Velocity as a function of time', body: 'v(t) = √(2P/m) · √t, with √(2P/m) = √(60 000 / 1200) = √50 ≈ 7.071 m/s^(3/2).' },
          { title: 'Integrate', body: 'x = ∫₀⁶ √50 · t^(1/2) dt = √50 · (2/3) · t^(3/2) evaluated at t = 6.0 s.' },
          { title: 'Evaluate', body: '6.0^(3/2) ≈ 14.70, so x ≈ 7.071 · (2/3) · 14.70 ≈ 69.28 m.' },
        ],
      },
    ],
    tags: ['power', 'integrals', 'work-energy theorem'],
    free: false,
  },
  {
    id: 'wep-05',
    unit: 'work-energy-power',
    difficulty: 'advanced',
    title: 'Friction that grows with distance',
    statement:
      'A 2.0 kg block slides along a horizontal surface, starting at x = 0 with speed 6.0 m/s in the +x direction. The surface gets rougher with distance: the coefficient of kinetic friction is μ(x) = 0.10 + 0.050x, where x is in meters.',
    parts: [
      {
        id: 'a',
        prompt: 'How much work does friction do on the block over the first 2.0 m? Give a signed value.',
        answer: { kind: 'numeric', value: -5.88, unit: 'J', tolerancePct: 2 },
        hint: 'The friction force is μ(x)mg, opposite the motion. Integrate it over x.',
        solution: [
          { title: 'Friction force', body: 'f(x) = μ(x)mg = 19.6(0.10 + 0.050x) N, pointing in −x.' },
          { title: 'Set up the integral', body: 'W_f = −∫₀ˣ 19.6(0.10 + 0.050x′) dx′ = −19.6(0.10x + 0.025x²).' },
          { title: 'Evaluate at x = 2.0 m', body: 'W_f = −19.6 · (0.20 + 0.10) = −19.6 · 0.30 = −5.88 J.' },
        ],
      },
      {
        id: 'b',
        prompt: 'How far does the block slide before it stops?',
        answer: { kind: 'numeric', value: 6.802, unit: 'm', tolerancePct: 2 },
        hint: 'The block stops when friction has removed all of its initial kinetic energy.',
        solution: [
          { title: 'Initial kinetic energy', body: 'K₀ = ½ · 2.0 · 6.0² = 36 J.' },
          { title: 'Work-energy theorem', body: '0 − 36 = −19.6(0.10x + 0.025x²)  →  0.49x² + 1.96x − 36 = 0.' },
          { title: 'Quadratic formula', body: 'x = [−1.96 + √(1.96² + 4 · 0.49 · 36)] / (2 · 0.49) = (−1.96 + √74.40) / 0.98.' },
          { title: 'Evaluate', body: 'x ≈ (−1.96 + 8.626) / 0.98 ≈ 6.802 m. The negative root is not physical.' },
        ],
      },
      {
        id: 'c',
        prompt: 'At the instant the block is at x = 0, at what rate is friction removing kinetic energy from it?',
        answer: { kind: 'numeric', value: 11.76, unit: 'W', tolerancePct: 2 },
        hint: 'Instantaneous power is force times speed.',
        solution: [
          { title: 'Friction at x = 0', body: 'f = μ(0)mg = 0.10 · 19.6 = 1.96 N.' },
          { title: 'Power', body: 'The rate of energy loss is |P| = fv = 1.96 · 6.0.' },
          { title: 'Evaluate', body: '|P| = 11.76 W (friction does work at −11.76 J/s).' },
        ],
      },
    ],
    tags: ['friction', 'work integral', 'power'],
    free: false,
  },
]
