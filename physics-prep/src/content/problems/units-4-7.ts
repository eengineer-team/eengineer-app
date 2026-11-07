import type { Problem } from '@/types/problem'

// Original practice problems for units 4-7 (momentum, rotation, oscillations, gravitation).
// Every numeric answer was computed with a script and rounded to 3-4 significant figures.
export const problemsUnits4to7: Problem[] = [
  // ───────────────────────────── Momentum ─────────────────────────────
  {
    id: 'mom-01',
    unit: 'momentum',
    difficulty: 'starter',
    title: 'Carts that stick together',
    statement:
      'On a level, frictionless track, cart A (mass 1.5 kg) moves in the +x direction at 4.0 m/s. It collides with cart B (mass 2.5 kg), which is at rest. Velcro on the bumpers makes the carts stick together after the collision.',
    parts: [
      {
        id: 'a',
        prompt: 'What is the velocity of the two carts just after the collision? (Positive means +x.)',
        answer: { kind: 'numeric', value: 1.5, unit: 'm/s', tolerancePct: 2 },
        hint: 'No external horizontal force acts during the collision, so one quantity is the same before and after.',
        solution: [
          { title: 'Pick the conserved quantity', body: 'The track is frictionless, so the total momentum of the two-cart system is conserved: Σp before = Σp after.' },
          { title: 'Momentum before', body: 'p = m_A·v_A + m_B·v_B = (1.5 kg)(4.0 m/s) + (2.5 kg)(0) = 6.0 kg·m/s.' },
          { title: 'Momentum after', body: 'The carts move together, so p = (m_A + m_B)·v = (4.0 kg)·v.' },
          { title: 'Solve', body: 'v = 6.0 / 4.0 = 1.5 m/s in the +x direction.' },
        ],
      },
      {
        id: 'b',
        prompt: 'How much kinetic energy is lost in the collision?',
        answer: { kind: 'numeric', value: 7.5, unit: 'J', tolerancePct: 2 },
        hint: 'Compute the total kinetic energy before and after, then subtract.',
        solution: [
          { title: 'Kinetic energy before', body: 'K₀ = ½(1.5 kg)(4.0 m/s)² = 12 J (cart B is at rest).' },
          { title: 'Kinetic energy after', body: 'K = ½(4.0 kg)(1.5 m/s)² = 4.5 J.' },
          { title: 'Energy lost', body: 'ΔK = 12 J − 4.5 J = 7.5 J is converted to internal energy (heat, sound, deformation).' },
        ],
      },
      {
        id: 'c',
        prompt: 'Which statement best describes this collision?',
        answer: {
          kind: 'choice',
          options: [
            'Both momentum and kinetic energy are conserved.',
            'Momentum is conserved, but kinetic energy is not.',
            'Kinetic energy is conserved, but momentum is not.',
            'Neither momentum nor kinetic energy is conserved.',
          ],
          correctIndex: 1,
        },
        solution: [
          { title: 'Momentum', body: 'With no net external force on the system, total momentum is conserved in every collision, elastic or not.' },
          { title: 'Kinetic energy', body: 'Part (b) shows 7.5 J of kinetic energy disappears. Objects that stick together undergo a perfectly inelastic collision, which loses the most kinetic energy allowed by momentum conservation.' },
          { title: 'Conclusion', body: 'Momentum is conserved, kinetic energy is not.' },
        ],
      },
    ],
    tags: ['collisions', 'inelastic', 'conservation'],
    free: true,
  },
  {
    id: 'mom-02',
    unit: 'momentum',
    difficulty: 'intermediate',
    title: 'Impulse from a changing force',
    statement:
      'A 0.80 kg hockey puck rests on frictionless, horizontal ice. Starting at t = 0, a horizontal force in the +x direction acts on it with magnitude F(t) = 6.0t − 1.5t² (F in newtons, t in seconds) until t = 4.0 s, when the force becomes zero. Ignore air resistance.',
    parts: [
      {
        id: 'a',
        prompt: 'What impulse does the force deliver from t = 0 to t = 4.0 s?',
        answer: { kind: 'numeric', value: 16, unit: 'N·s', tolerancePct: 2 },
        hint: 'Impulse is the area under the F–t curve, so integrate F(t) over the time interval.',
        solution: [
          { title: 'Definition', body: 'J = ∫F dt from t = 0 to t = 4.0 s.' },
          { title: 'Integrate', body: '∫(6.0t − 1.5t²) dt = 3.0t² − 0.5t³.' },
          { title: 'Evaluate', body: 'J = 3.0(4.0)² − 0.5(4.0)³ = 48 − 32 = 16 N·s in the +x direction.' },
        ],
      },
      {
        id: 'b',
        prompt: 'What is the speed of the puck at t = 4.0 s?',
        answer: { kind: 'numeric', value: 20, unit: 'm/s', tolerancePct: 2 },
        hint: 'Use the impulse–momentum theorem.',
        solution: [
          { title: 'Impulse–momentum theorem', body: 'J = Δp = m·v − m·v₀, and v₀ = 0.' },
          { title: 'Solve', body: 'v = J / m = 16 N·s / 0.80 kg = 20 m/s.' },
          { title: 'After t = 4.0 s', body: 'The force is zero from then on and the ice is frictionless, so the puck keeps moving at 20 m/s.' },
        ],
      },
      {
        id: 'c',
        prompt: 'What is the speed of the puck at t = 2.0 s?',
        answer: { kind: 'numeric', value: 10, unit: 'm/s', tolerancePct: 2 },
        hint: 'Same integral, different upper limit.',
        solution: [
          { title: 'Impulse up to t = 2.0 s', body: 'J = 3.0(2.0)² − 0.5(2.0)³ = 12 − 4 = 8.0 N·s.' },
          { title: 'Speed', body: 'v = J / m = 8.0 / 0.80 = 10 m/s.' },
          { title: 'Check', body: 'The force is largest at t = 2.0 s, yet the puck has only half its final speed, because the speed depends on the accumulated area under F(t), not on the force at that instant.' },
        ],
      },
    ],
    tags: ['impulse', 'calculus', 'variable force'],
    free: true,
  },
  {
    id: 'mom-03',
    unit: 'momentum',
    difficulty: 'intermediate',
    title: 'Center of mass of a tapered rod',
    statement:
      'A thin rod lies along the x-axis from x = 0 to x = 2.0 m. Its linear mass density increases along its length as λ(x) = 3.0 + 1.5x, where λ is in kg/m and x is in meters.',
    parts: [
      {
        id: 'a',
        prompt: 'What is the total mass of the rod?',
        answer: { kind: 'numeric', value: 9, unit: 'kg', tolerancePct: 2 },
        hint: 'A small piece of length dx has mass dm = λ(x) dx.',
        solution: [
          { title: 'Set up', body: 'M = ∫dm = ∫λ(x) dx from 0 to 2.0 m.' },
          { title: 'Integrate', body: '∫(3.0 + 1.5x) dx = 3.0x + 0.75x².' },
          { title: 'Evaluate', body: 'M = 3.0(2.0) + 0.75(2.0)² = 6.0 + 3.0 = 9.0 kg.' },
        ],
      },
      {
        id: 'b',
        prompt: 'Where is the rod’s center of mass, measured from x = 0?',
        answer: { kind: 'numeric', value: 1.111, unit: 'm', tolerancePct: 2 },
        hint: 'x_cm = (1/M)∫x dm. Expect an answer past the midpoint, since the right end is denser.',
        solution: [
          { title: 'Definition', body: 'x_cm = (1/M)∫x·λ(x) dx from 0 to 2.0 m.' },
          { title: 'Integrate', body: '∫x(3.0 + 1.5x) dx = ∫(3.0x + 1.5x²) dx = 1.5x² + 0.5x³.' },
          { title: 'Evaluate the integral', body: '1.5(2.0)² + 0.5(2.0)³ = 6.0 + 4.0 = 10 kg·m.' },
          { title: 'Divide by the mass', body: 'x_cm = 10 / 9.0 ≈ 1.111 m, a little past the midpoint (1.0 m), as expected.' },
        ],
      },
    ],
    tags: ['center of mass', 'calculus', 'density'],
    free: false,
  },
  {
    id: 'mom-04',
    unit: 'momentum',
    difficulty: 'advanced',
    title: 'Sand on a conveyor belt',
    statement:
      'Sand falls vertically from a hopper onto a horizontal conveyor belt at a steady rate of 40 kg/s. A motor keeps the belt moving at a constant speed of 1.5 m/s. The sand lands with no horizontal velocity, slides briefly, and then moves with the belt. Consider the steady state.',
    parts: [
      {
        id: 'a',
        prompt: 'What horizontal force must the belt exert on the sand to keep the belt’s speed constant?',
        answer: { kind: 'numeric', value: 60, unit: 'N', tolerancePct: 2 },
        hint: 'Newton’s second law in the form F = dp/dt. Here the speed is constant but the moving mass keeps growing.',
        solution: [
          { title: 'Use F = dp/dt', body: 'The horizontal momentum of sand on the belt is p = m·v. With v constant, dp/dt = v·(dm/dt).' },
          { title: 'Substitute', body: 'F = (1.5 m/s)(40 kg/s) = 60 N.' },
          { title: 'Interpret', body: 'Each second, 40 kg of sand must be brought from 0 to 1.5 m/s, which takes 60 kg·m/s of momentum per second.' },
        ],
      },
      {
        id: 'b',
        prompt: 'What power must the motor deliver to the belt (ignore friction in the motor and rollers)?',
        answer: { kind: 'numeric', value: 90, unit: 'W', tolerancePct: 2 },
        hint: 'Power delivered by a force on something moving at speed v is P = F·v.',
        solution: [
          { title: 'Power', body: 'The motor must supply the 60 N force at the belt speed: P = F·v.' },
          { title: 'Substitute', body: 'P = (60 N)(1.5 m/s) = 90 W.' },
          { title: 'Symbolic form', body: 'P = v·(dm/dt)·v = (dm/dt)v², which grows with the square of the belt speed.' },
        ],
      },
      {
        id: 'c',
        prompt: 'The sand’s kinetic energy increases at a rate of ½(dm/dt)v². Compare this with the motor power you found in part (b). What happens to the difference?',
        answer: {
          kind: 'choice',
          options: [
            'It is stored as gravitational potential energy of the sand.',
            'It is converted to internal energy by kinetic friction while the sand slides on the belt.',
            'Nothing: the 45 W figure is wrong, and the sand gains 90 W of kinetic energy.',
            'It is carried away as the sand’s vertical momentum.',
          ],
          correctIndex: 1,
        },
        solution: [
          { title: 'Compare the rates', body: 'Motor power is (dm/dt)v² = 90 W; the rate of kinetic-energy gain is ½(dm/dt)v² = 45 W. Exactly half is missing.' },
          { title: 'Where it goes', body: 'Each grain lands at rest and slides relative to the belt until it matches the belt’s speed. Kinetic friction between sand and belt does negative net work on the system during that slipping, turning 45 W into internal energy (heat).' },
          { title: 'Rule out the others', body: 'The belt is horizontal, so no gravitational potential energy is gained. The sand ends up moving at exactly 1.5 m/s, so its kinetic energy really does grow at only ½(40)(1.5)² = 45 W. Momentum is not a form of energy, so it cannot carry energy away.' },
        ],
      },
    ],
    tags: ['variable mass', 'power', 'momentum flow'],
    free: false,
  },

  // ───────────────────────────── Rotation ─────────────────────────────
  {
    id: 'rot-01',
    unit: 'rotation',
    difficulty: 'starter',
    title: 'A fan spinning down',
    statement:
      'A ceiling fan is spinning at 12 rad/s when it is switched off. It slows down with constant angular acceleration and stops 6.0 s later. Take the fan’s initial direction of rotation as positive.',
    parts: [
      {
        id: 'a',
        prompt: 'What is the fan’s angular acceleration?',
        answer: { kind: 'numeric', value: -2, unit: 'rad/s²', tolerancePct: 2 },
        hint: 'Angular acceleration is the change in angular velocity divided by the time. Watch the sign.',
        solution: [
          { title: 'Definition', body: 'α = Δω / Δt = (ω − ω₀) / Δt.' },
          { title: 'Substitute', body: 'α = (0 − 12 rad/s) / 6.0 s = −2.0 rad/s².' },
          { title: 'Sign', body: 'The negative sign means α points opposite the rotation, so the fan slows down.' },
        ],
      },
      {
        id: 'b',
        prompt: 'How many revolutions does the fan make while it slows to a stop?',
        answer: { kind: 'numeric', value: 5.73, unit: 'rev', tolerancePct: 2 },
        hint: 'Find the angle in radians first; one revolution is 2π rad.',
        solution: [
          { title: 'Angle turned', body: 'With constant α, Δθ = ½(ω₀ + ω)·Δt = ½(12 + 0)(6.0) = 36 rad.' },
          { title: 'Check with another equation', body: 'Δθ = ω₀t + ½αt² = 12(6.0) + ½(−2.0)(6.0)² = 72 − 36 = 36 rad.' },
          { title: 'Convert to revolutions', body: '36 rad / (2π rad/rev) ≈ 5.73 rev.' },
        ],
      },
    ],
    tags: ['angular kinematics', 'constant alpha'],
    free: true,
  },
  {
    id: 'rot-02',
    unit: 'rotation',
    difficulty: 'intermediate',
    title: 'A rod swinging from one end',
    statement:
      'A uniform thin rod of mass 1.2 kg and length 0.90 m is attached to a frictionless pivot at one end. It is held horizontal and released from rest. Use g = 9.8 m/s².',
    parts: [
      {
        id: 'a',
        prompt: 'Find the rod’s rotational inertia about the pivot by integration.',
        answer: { kind: 'numeric', value: 0.324, unit: 'kg·m²', tolerancePct: 2 },
        hint: 'Put the pivot at x = 0. A slice dx has mass dm = (M/L)dx at distance x from the axis.',
        solution: [
          { title: 'Set up', body: 'I = ∫r² dm. With λ = M/L and the pivot at x = 0, I = ∫x²(M/L) dx from 0 to L.' },
          { title: 'Integrate', body: 'I = (M/L)·(L³/3) = ⅓ML².' },
          { title: 'Substitute', body: 'I = ⅓(1.2 kg)(0.90 m)² = ⅓(1.2)(0.81) = 0.324 kg·m².' },
        ],
      },
      {
        id: 'b',
        prompt: 'What is the rod’s angular acceleration at the instant it is released?',
        answer: { kind: 'numeric', value: 16.33, unit: 'rad/s²', tolerancePct: 2 },
        hint: 'Gravity acts at the center of mass, L/2 from the pivot, and is perpendicular to the rod when it is horizontal.',
        solution: [
          { title: 'Torque from gravity', body: 'τ = Mg·(L/2) = (1.2)(9.8)(0.45) = 5.292 N·m.' },
          { title: 'Newton’s second law for rotation', body: 'α = τ / I = 5.292 / 0.324 ≈ 16.33 rad/s².' },
          { title: 'Symbolic check', body: 'α = (MgL/2) / (ML²/3) = 3g/(2L) = 3(9.8)/(1.8) ≈ 16.33 rad/s². The mass cancels.' },
        ],
      },
      {
        id: 'c',
        prompt: 'What is the rod’s angular speed as it swings through the vertical position?',
        answer: { kind: 'numeric', value: 5.715, unit: 'rad/s', tolerancePct: 2 },
        hint: 'α changes as the rod swings, so use energy conservation instead of kinematics.',
        solution: [
          { title: 'Why energy', body: 'The torque, and therefore α, decreases as the rod swings down, so constant-α equations do not apply. The pivot is frictionless, so mechanical energy is conserved.' },
          { title: 'Height change', body: 'The center of mass drops by L/2 = 0.45 m, so ΔU = Mg(L/2) = 5.292 J.' },
          { title: 'Energy equation', body: 'Mg(L/2) = ½Iω² → ω² = 2(5.292) / 0.324 = 32.67 rad²/s².' },
          { title: 'Solve', body: 'ω = √32.67 ≈ 5.715 rad/s (equivalently ω = √(3g/L)).' },
        ],
      },
    ],
    tags: ['rotational inertia', 'calculus', 'energy'],
    free: true,
  },
  {
    id: 'rot-03',
    unit: 'rotation',
    difficulty: 'starter',
    title: 'Torque on a wrench',
    statement:
      'A mechanic pulls on the end of a wrench with a force of 40 N. The force is applied 0.25 m from the center of the bolt, and the angle between the wrench handle and the force is 60°.',
    parts: [
      {
        id: 'a',
        prompt: 'What is the magnitude of the torque on the bolt?',
        answer: { kind: 'numeric', value: 8.66, unit: 'N·m', tolerancePct: 2 },
        hint: 'Only the component of the force perpendicular to the handle produces torque.',
        solution: [
          { title: 'Formula', body: 'τ = rF·sin θ, where θ is the angle between r (along the handle) and F.' },
          { title: 'Substitute', body: 'τ = (0.25 m)(40 N)·sin 60° = 10 × 0.866.' },
          { title: 'Result', body: 'τ ≈ 8.66 N·m.' },
        ],
      },
      {
        id: 'b',
        prompt: 'Keeping the force magnitude at 40 N, which change gives the largest torque?',
        answer: {
          kind: 'choice',
          options: [
            'Pull at 60° but 0.15 m from the bolt.',
            'Pull at 30° to the handle, 0.25 m from the bolt.',
            'Pull at 90° to the handle, 0.25 m from the bolt.',
            'Pull along the handle (0°), 0.40 m from the bolt.',
          ],
          correctIndex: 2,
        },
        solution: [
          { title: 'Key idea', body: 'Torque depends on both the lever arm r and the angle, through sin θ, which is largest (1) at θ = 90°.' },
          { title: 'Compute each option', body: 'τ = rF·sin θ: (0.15)(40)·sin 60° ≈ 5.2 N·m; (0.25)(40)·sin 30° = 5.0 N·m; (0.25)(40)·sin 90° = 10 N·m; (0.40)(40)·sin 0° = 0.' },
          { title: 'Conclusion', body: 'Pulling perpendicular to the handle gives the largest torque, 10 N·m. A force along the handle produces no torque at any distance.' },
        ],
      },
    ],
    tags: ['torque', 'cross product'],
    free: true,
  },
  {
    id: 'rot-04',
    unit: 'rotation',
    difficulty: 'intermediate',
    title: 'Block unwinding a heavy pulley',
    statement:
      'A light string is wrapped around a solid disk-shaped pulley of mass 3.0 kg and radius 0.15 m that turns on a frictionless horizontal axle. A 2.0 kg block hangs from the free end of the string and is released from rest. The string does not slip on the pulley. Use g = 9.8 m/s² and I = ½MR² for the pulley.',
    parts: [
      {
        id: 'a',
        prompt: 'What is the magnitude of the block’s acceleration?',
        answer: { kind: 'numeric', value: 5.6, unit: 'm/s²', tolerancePct: 2 },
        hint: 'Write Newton’s second law for the block and for the pulley, then connect them with a = αR.',
        solution: [
          { title: 'Block (down is positive)', body: 'mg − T = ma.' },
          { title: 'Pulley', body: 'TR = Iα = (½MR²)(a/R), so T = ½Ma.' },
          { title: 'Combine', body: 'mg − ½Ma = ma → a = mg / (m + ½M).' },
          { title: 'Substitute', body: 'a = (2.0)(9.8) / (2.0 + 1.5) = 19.6 / 3.5 = 5.6 m/s².' },
        ],
      },
      {
        id: 'b',
        prompt: 'What is the tension in the string?',
        answer: { kind: 'numeric', value: 8.4, unit: 'N', tolerancePct: 2 },
        hint: 'Use either equation from part (a).',
        solution: [
          { title: 'Choose an equation', body: 'Either the pulley equation T = ½Ma or the block equation mg − T = ma gives T.' },
          { title: 'From the pulley equation', body: 'T = ½Ma = ½(3.0)(5.6) = 8.4 N.' },
          { title: 'Check with the block', body: 'T = m(g − a) = 2.0(9.8 − 5.6) = 8.4 N. The tension is less than the block’s weight (19.6 N), as it must be for the block to accelerate downward.' },
        ],
      },
      {
        id: 'c',
        prompt: 'What is the angular acceleration of the pulley?',
        answer: { kind: 'numeric', value: 37.33, unit: 'rad/s²', tolerancePct: 2 },
        hint: 'The string does not slip, so the rim moves with the string.',
        solution: [
          { title: 'Rolling constraint', body: 'a = αR, so α = a / R.' },
          { title: 'Substitute', body: 'α = 5.6 / 0.15 ≈ 37.33 rad/s².' },
          { title: 'Check with torque', body: 'α = TR / I = (8.4)(0.15) / (½·3.0·0.15²) = 1.26 / 0.03375 ≈ 37.33 rad/s².' },
        ],
      },
    ],
    tags: ['torque', 'pulley', 'newton second law'],
    free: false,
    simulator: { tool: 'fbd', preset: 'hanging-mass' },
  },
  {
    id: 'rot-05',
    unit: 'rotation',
    difficulty: 'advanced',
    title: 'Clay strikes a hanging rod',
    statement:
      'A uniform rod of mass 0.80 kg and length 1.0 m hangs vertically at rest from a frictionless pivot at its top end. A 0.20 kg ball of clay moving horizontally at 5.0 m/s strikes the bottom end of the rod and sticks to it. Treat the clay as a point mass. Use g = 9.8 m/s².',
    parts: [
      {
        id: 'a',
        prompt: 'Which quantity of the clay + rod system is conserved during the brief collision?',
        answer: {
          kind: 'choice',
          options: [
            'Linear momentum',
            'Angular momentum about the pivot',
            'Kinetic energy',
            'Mechanical energy',
          ],
          correctIndex: 1,
        },
        hint: 'The pivot pushes on the rod during the collision, and the clay sticks. For each option, ask whether either of those facts could change it.',
        solution: [
          { title: 'Linear momentum', body: 'The pivot exerts a large horizontal force on the rod during the impact, so linear momentum is not conserved.' },
          { title: 'Angular momentum', body: 'The pivot force acts at the axis, so its torque about the pivot is zero. Gravity also produces no torque at the instant of impact. Angular momentum about the pivot is conserved.' },
          { title: 'Energy', body: 'The clay sticks, so the collision is perfectly inelastic and kinetic (and mechanical) energy is not conserved.' },
        ],
      },
      {
        id: 'b',
        prompt: 'What is the angular speed of the rod + clay just after the collision?',
        answer: { kind: 'numeric', value: 2.143, unit: 'rad/s', tolerancePct: 2 },
        hint: 'Angular momentum of a point mass moving perpendicular to the lever arm is L = mvr.',
        solution: [
          { title: 'Angular momentum before', body: 'L = m·v·r = (0.20)(5.0)(1.0) = 1.0 kg·m²/s.' },
          { title: 'Rotational inertia after', body: 'I = ⅓ML² + mL² = ⅓(0.80)(1.0)² + (0.20)(1.0)² = 0.2667 + 0.20 = 0.4667 kg·m².' },
          { title: 'Conserve L', body: 'ω = L / I = 1.0 / 0.4667 ≈ 2.143 rad/s.' },
        ],
      },
      {
        id: 'c',
        prompt: 'Through what maximum angle from the vertical does the rod swing? Give your answer in degrees.',
        answer: { kind: 'numeric', value: 35.14, unit: '°', tolerancePct: 2 },
        hint: 'After the collision mechanical energy is conserved. Track the rise of the system’s center of mass.',
        solution: [
          { title: 'Kinetic energy after the collision', body: 'K = ½Iω² = ½(0.4667)(2.143)² ≈ 1.071 J.' },
          { title: 'Center of mass of the system', body: 'd = (M·L/2 + m·L) / (M + m) = (0.40 + 0.20) / 1.0 = 0.60 m below the pivot.' },
          { title: 'Energy conservation', body: 'K = (M + m)·g·d·(1 − cos θ) → 1.071 = (1.0)(9.8)(0.60)(1 − cos θ) = 5.88(1 − cos θ).' },
          { title: 'Solve', body: '1 − cos θ = 0.1822, cos θ = 0.8178, θ ≈ 35.14°.' },
        ],
      },
    ],
    tags: ['angular momentum', 'collisions', 'energy'],
    free: false,
  },

  // ─────────────────────────── Oscillations ───────────────────────────
  {
    id: 'osc-01',
    unit: 'oscillations',
    difficulty: 'starter',
    title: 'Block on a spring',
    statement:
      'A 0.50 kg block on a frictionless horizontal surface is attached to a spring with spring constant 200 N/m. The block is pulled 0.080 m from equilibrium and released from rest.',
    parts: [
      {
        id: 'a',
        prompt: 'What is the period of the oscillation?',
        answer: { kind: 'numeric', value: 0.3142, unit: 's', tolerancePct: 2 },
        hint: 'For a mass on a spring, ω = √(k/m) and T = 2π/ω.',
        solution: [
          { title: 'Angular frequency', body: 'ω = √(k/m) = √(200 / 0.50) = √400 = 20 rad/s.' },
          { title: 'Period', body: 'T = 2π/ω = 2π/20 ≈ 0.3142 s.' },
          { title: 'Note', body: 'The period does not depend on the 0.080 m amplitude.' },
        ],
      },
      {
        id: 'b',
        prompt: 'What is the block’s maximum speed?',
        answer: { kind: 'numeric', value: 1.6, unit: 'm/s', tolerancePct: 2 },
        hint: 'The block is fastest at equilibrium. Use v_max = Aω or energy conservation.',
        solution: [
          { title: 'Amplitude', body: 'Released from rest at 0.080 m, so A = 0.080 m.' },
          { title: 'Maximum speed', body: 'v_max = Aω = (0.080)(20) = 1.6 m/s.' },
          { title: 'Energy check', body: '½kA² = ½(200)(0.080)² = 0.64 J = ½(0.50)v_max² → v_max = 1.6 m/s.' },
        ],
      },
    ],
    tags: ['shm', 'springs', 'period'],
    free: true,
    simulator: { tool: 'motion', preset: 'spring' },
  },
  {
    id: 'osc-02',
    unit: 'oscillations',
    difficulty: 'intermediate',
    title: 'Reading a position function',
    statement:
      'A 0.40 kg cart attached to a horizontal spring moves along the x-axis with position x(t) = 0.12 cos(5.0t + π/6), where x is in meters, t is in seconds, and the angle is in radians. Friction is negligible.',
    parts: [
      {
        id: 'a',
        prompt: 'What is the cart’s velocity at t = 0? (Positive means +x.)',
        answer: { kind: 'numeric', value: -0.3, unit: 'm/s', tolerancePct: 2 },
        hint: 'Differentiate x(t) with respect to time.',
        solution: [
          { title: 'Differentiate', body: 'v(t) = dx/dt = −(0.12)(5.0)·sin(5.0t + π/6) = −0.60·sin(5.0t + π/6).' },
          { title: 'Evaluate at t = 0', body: 'v(0) = −0.60·sin(π/6) = −0.60 × 0.5.' },
          { title: 'Result', body: 'v(0) = −0.30 m/s: the cart is moving in the −x direction.' },
        ],
      },
      {
        id: 'b',
        prompt: 'What is the maximum magnitude of the net force on the cart?',
        answer: { kind: 'numeric', value: 1.2, unit: 'N', tolerancePct: 2 },
        hint: 'Differentiate again to get a(t), then use F = ma.',
        solution: [
          { title: 'Acceleration', body: 'a(t) = dv/dt = −(0.12)(5.0)²·cos(5.0t + π/6) = −3.0·cos(5.0t + π/6) m/s².' },
          { title: 'Maximum', body: '|a|max = Aω² = 3.0 m/s², reached at the turning points x = ±0.12 m.' },
          { title: 'Force', body: 'F_max = m·|a|max = (0.40)(3.0) = 1.2 N.' },
        ],
      },
      {
        id: 'c',
        prompt: 'What is the spring constant?',
        answer: { kind: 'numeric', value: 10, unit: 'N/m', tolerancePct: 2 },
        hint: 'Compare ω in x(t) with ω = √(k/m).',
        solution: [
          { title: 'Read ω', body: 'The coefficient of t inside the cosine is ω = 5.0 rad/s.' },
          { title: 'Relate to k', body: 'ω² = k/m → k = mω² = (0.40)(5.0)² = 10 N/m.' },
          { title: 'Check', body: 'F_max = kA = (10)(0.12) = 1.2 N, matching part (b).' },
        ],
      },
    ],
    tags: ['shm', 'calculus', 'springs'],
    free: true,
    simulator: { tool: 'motion', preset: 'spring' },
  },
  {
    id: 'osc-03',
    unit: 'oscillations',
    difficulty: 'intermediate',
    title: 'A rod as a physical pendulum',
    statement:
      'A uniform thin rod of length 1.2 m is hung from a frictionless pivot at one end and set swinging through small angles. Use g = 9.8 m/s².',
    parts: [
      {
        id: 'a',
        prompt: 'What is the period of small oscillations?',
        answer: { kind: 'numeric', value: 1.795, unit: 's', tolerancePct: 2 },
        hint: 'For a physical pendulum, T = 2π√(I / (M·g·d)), where d is the pivot-to-center-of-mass distance.',
        solution: [
          { title: 'Restoring torque', body: 'For a small angle θ, τ = −Mg·d·sin θ ≈ −Mg·d·θ, so I·d²θ/dt² = −Mg·d·θ. This is SHM with ω² = Mg·d / I.' },
          { title: 'Values for the rod', body: 'I = ⅓ML² about the end and d = L/2, so ω² = (Mg·L/2) / (⅓ML²) = 3g / (2L).' },
          { title: 'Period', body: 'T = 2π√(2L / (3g)) = 2π√(2.4 / 29.4) = 2π√0.08163.' },
          { title: 'Result', body: 'T = 2π(0.2857) ≈ 1.795 s.' },
        ],
      },
      {
        id: 'b',
        prompt: 'A simple pendulum (point mass on a light string) has the same period. How long is its string?',
        answer: { kind: 'numeric', value: 0.8, unit: 'm', tolerancePct: 2 },
        hint: 'Set 2π√(ℓ/g) equal to the rod’s period.',
        solution: [
          { title: 'Match the periods', body: '2π√(ℓ/g) = 2π√(2L/(3g)) → ℓ = ⅔L.' },
          { title: 'Substitute', body: 'ℓ = ⅔(1.2 m) = 0.80 m.' },
          { title: 'Interpret', body: 'The rod swings faster than a 1.2 m simple pendulum because much of its mass is close to the pivot.' },
        ],
      },
    ],
    tags: ['physical pendulum', 'shm', 'period'],
    free: true,
  },
  {
    id: 'osc-04',
    unit: 'oscillations',
    difficulty: 'advanced',
    title: 'Solving SHM from initial conditions',
    statement:
      'A 0.30 kg block on a frictionless horizontal surface is attached to a spring with k = 120 N/m. Newton’s second law gives m·d²x/dt² = −kx, where x is measured from equilibrium. At t = 0 the block is at x₀ = +0.050 m and has velocity v₀ = −0.60 m/s (moving toward equilibrium). Write the solution as x(t) = A cos(ωt + φ) with A > 0.',
    parts: [
      {
        id: 'a',
        prompt: 'What is the amplitude A?',
        answer: { kind: 'numeric', value: 0.05831, unit: 'm', tolerancePct: 2 },
        hint: 'Find ω first. Then either combine x₀ and v₀/ω, or use energy: ½kA² = ½kx₀² + ½mv₀².',
        solution: [
          { title: 'Angular frequency', body: 'Substituting x = A cos(ωt + φ) into m·x″ = −kx gives ω = √(k/m) = √(120 / 0.30) = 20 rad/s.' },
          { title: 'Apply initial conditions', body: 'x(0) = A cos φ = 0.050 and v(0) = −Aω sin φ = −0.60, so A sin φ = 0.60/20 = 0.030 m.' },
          { title: 'Amplitude', body: 'A = √(0.050² + 0.030²) = √0.0034 ≈ 0.05831 m.' },
        ],
      },
      {
        id: 'b',
        prompt: 'At what time does the block first pass through x = 0?',
        answer: { kind: 'numeric', value: 0.05152, unit: 's', tolerancePct: 2 },
        hint: 'Find the phase constant φ, then solve ωt + φ = π/2.',
        solution: [
          { title: 'Phase constant', body: 'tan φ = (A sin φ)/(A cos φ) = 0.030/0.050 = 0.60. Both sin φ and cos φ are positive, so φ = arctan 0.60 ≈ 0.5404 rad.' },
          { title: 'Condition for x = 0', body: 'x = 0 when cos(ωt + φ) = 0. The first time after t = 0 is when ωt + φ = π/2.' },
          { title: 'Solve', body: 't = (π/2 − φ)/ω = (1.5708 − 0.5404)/20 ≈ 0.05152 s.' },
          { title: 'Sanity check', body: 'This is less than a quarter period (T/4 = 0.0785 s), which makes sense because the block starts closer than A to equilibrium and is already moving toward it.' },
        ],
      },
      {
        id: 'c',
        prompt: 'What is the total mechanical energy of the oscillator?',
        answer: { kind: 'numeric', value: 0.204, unit: 'J', tolerancePct: 2 },
        hint: 'Add the spring potential energy and kinetic energy at t = 0.',
        solution: [
          { title: 'Energy at t = 0', body: 'E = ½kx₀² + ½mv₀² = ½(120)(0.050)² + ½(0.30)(0.60)².' },
          { title: 'Evaluate', body: 'E = 0.150 J + 0.054 J = 0.204 J.' },
          { title: 'Check', body: '½kA² = ½(120)(0.0034) = 0.204 J, the same.' },
        ],
      },
    ],
    tags: ['shm', 'differential equations', 'phase'],
    free: false,
    simulator: { tool: 'motion', preset: 'spring' },
  },

  // ─────────────────────────── Gravitation ───────────────────────────
  {
    id: 'grav-01',
    unit: 'gravitation',
    difficulty: 'starter',
    title: 'Satellite in low Earth orbit',
    statement:
      'A satellite moves in a circular orbit 400 km above Earth’s surface. Use G = 6.67 × 10⁻¹¹ N·m²/kg², Earth’s mass M = 5.97 × 10²⁴ kg, and Earth’s radius R = 6.37 × 10⁶ m.',
    parts: [
      {
        id: 'a',
        prompt: 'What is the satellite’s orbital speed?',
        answer: { kind: 'numeric', value: 7669, unit: 'm/s', tolerancePct: 2 },
        hint: 'Gravity provides the centripetal force. Measure the orbit radius from Earth’s center.',
        solution: [
          { title: 'Orbit radius', body: 'r = R + h = 6.37 × 10⁶ m + 0.40 × 10⁶ m = 6.77 × 10⁶ m.' },
          { title: 'Gravity is the centripetal force', body: 'GMm/r² = mv²/r → v = √(GM/r).' },
          { title: 'Substitute', body: 'GM = (6.67 × 10⁻¹¹)(5.97 × 10²⁴) = 3.982 × 10¹⁴ m³/s², so v = √(3.982 × 10¹⁴ / 6.77 × 10⁶).' },
          { title: 'Result', body: 'v ≈ 7669 m/s (about 7.7 km/s). The satellite’s mass cancels.' },
        ],
      },
      {
        id: 'b',
        prompt: 'What is the orbital period?',
        answer: { kind: 'numeric', value: 5546, unit: 's', tolerancePct: 2 },
        hint: 'One orbit is a distance of 2πr.',
        solution: [
          { title: 'Period from speed', body: 'T = 2πr / v = 2π(6.77 × 10⁶ m) / 7669 m/s.' },
          { title: 'Result', body: 'T ≈ 5546 s, about 92 minutes.' },
          { title: 'Check with Kepler’s third law', body: 'T = 2π√(r³/GM) = 2π√((6.77 × 10⁶)³ / 3.982 × 10¹⁴) ≈ 5546 s, the same.' },
        ],
      },
    ],
    tags: ['orbits', 'circular motion'],
    free: true,
  },
  {
    id: 'grav-02',
    unit: 'gravitation',
    difficulty: 'intermediate',
    title: 'A fast launch from the Moon',
    statement:
      'A probe is launched straight up from the Moon’s surface at 1500 m/s. The Moon has no atmosphere. Use G = 6.67 × 10⁻¹¹ N·m²/kg², the Moon’s mass M = 7.35 × 10²² kg, and its radius R = 1.74 × 10⁶ m.',
    parts: [
      {
        id: 'a',
        prompt: 'What maximum height above the Moon’s surface does the probe reach?',
        answer: { kind: 'numeric', value: 1.157e6, unit: 'm', tolerancePct: 2 },
        hint: 'The probe goes far enough that g changes. Use U = −GMm/r and conserve energy between the surface and the highest point.',
        solution: [
          { title: 'Energy conservation', body: '½mv₀² − GMm/R = 0 − GMm/r, where r is the distance from the Moon’s center at the top. The probe’s mass cancels.' },
          { title: 'Numbers', body: 'GM = (6.67 × 10⁻¹¹)(7.35 × 10²²) = 4.902 × 10¹² m³/s². GM/R = 2.8175 × 10⁶ J/kg and ½v₀² = 1.125 × 10⁶ J/kg.' },
          { title: 'Solve for r', body: 'GM/r = 2.8175 × 10⁶ − 1.125 × 10⁶ = 1.6925 × 10⁶ J/kg → r = 4.902 × 10¹² / 1.6925 × 10⁶ ≈ 2.897 × 10⁶ m.' },
          { title: 'Height', body: 'h = r − R = 2.897 × 10⁶ − 1.74 × 10⁶ ≈ 1.157 × 10⁶ m (about 1157 km).' },
        ],
      },
      {
        id: 'b',
        prompt: 'A classmate uses h = v₀²/(2g) with the surface value g = GM/R² ≈ 1.62 m/s². How does that estimate compare with the answer to part (a)?',
        answer: {
          kind: 'choice',
          options: [
            'It is too large, because g increases with height.',
            'It is too small, because the real gravitational pull weakens as the probe rises.',
            'It is exactly right, because energy is conserved either way.',
            'It is too small, because it ignores the Moon’s rotation.',
          ],
          correctIndex: 1,
        },
        hint: 'How does the gravitational force change as r increases?',
        solution: [
          { title: 'Constant-g estimate', body: 'h = (1500)² / (2 × 1.619) ≈ 6.95 × 10⁵ m, about 695 km.' },
          { title: 'Compare', body: 'Part (a) gave about 1157 km, so the estimate is far too small.' },
          { title: 'Reason', body: 'Gravity falls off as 1/r². Above the surface the real force is weaker than the surface value, so the probe decelerates less and climbs higher. Constant g only works when h ≪ R.' },
        ],
      },
    ],
    tags: ['energy', 'potential energy', 'launch'],
    free: true,
  },
  {
    id: 'grav-03',
    unit: 'gravitation',
    difficulty: 'advanced',
    title: 'A tunnel through the Earth',
    statement:
      'Imagine a straight, frictionless, airless tunnel drilled through the center of the Earth from one side to the other. Model the Earth as a uniform-density sphere with mass M = 5.97 × 10²⁴ kg and radius R = 6.37 × 10⁶ m, and use G = 6.67 × 10⁻¹¹ N·m²/kg². A small object is dropped from rest into the tunnel at the surface. Ignore Earth’s rotation.',
    parts: [
      {
        id: 'a',
        prompt: 'When the object is a distance r from Earth’s center (r < R), how does the magnitude of the gravitational force on it depend on r?',
        answer: {
          kind: 'choice',
          options: [
            'F ∝ 1/r², the same as outside the Earth',
            'F is constant, equal to its value at the surface',
            'F ∝ r',
            'F = 0 everywhere inside the Earth',
          ],
          correctIndex: 2,
        },
        hint: 'By the shell theorem, only the mass closer to the center than r pulls on the object.',
        solution: [
          { title: 'Shell theorem', body: 'Mass in the shell outside radius r exerts no net force. Only the inner sphere of mass M(r) acts, as if concentrated at the center.' },
          { title: 'Enclosed mass', body: 'For uniform density, M(r) = M·(r/R)³.' },
          { title: 'Force', body: 'F = G·M(r)·m / r² = (GMm/R³)·r, so F ∝ r and points toward the center.' },
        ],
      },
      {
        id: 'b',
        prompt: 'How long does it take the object to travel to the far side and return to its starting point (one full period)?',
        answer: { kind: 'numeric', value: 5062, unit: 's', tolerancePct: 2 },
        hint: 'A restoring force proportional to displacement means SHM. Identify the effective “spring constant.”',
        solution: [
          { title: 'Equation of motion', body: 'm·d²r/dt² = −(GMm/R³)·r. This is SHM with ω² = GM/R³ (the mass m cancels).' },
          { title: 'Numbers', body: 'GM = 3.982 × 10¹⁴ m³/s² and R³ = 2.585 × 10²⁰ m³, so R³/GM ≈ 6.491 × 10⁵ s².' },
          { title: 'Period', body: 'T = 2π√(R³/GM) = 2π√(6.491 × 10⁵) ≈ 5062 s, about 84 minutes.' },
        ],
      },
      {
        id: 'c',
        prompt: 'What is the object’s speed as it passes through Earth’s center?',
        answer: { kind: 'numeric', value: 7906, unit: 'm/s', tolerancePct: 2 },
        hint: 'In SHM, the maximum speed is v_max = Aω. What is the amplitude here?',
        solution: [
          { title: 'Amplitude', body: 'The object starts from rest at the surface, so A = R.' },
          { title: 'Maximum speed', body: 'v_max = Aω = R·√(GM/R³) = √(GM/R).' },
          { title: 'Substitute', body: 'v_max = √(3.982 × 10¹⁴ / 6.37 × 10⁶) = √(6.251 × 10⁷) ≈ 7906 m/s.' },
          { title: 'Connection', body: 'This equals the speed of a satellite in a circular orbit skimming Earth’s surface, and the period matches that orbit’s period too.' },
        ],
      },
    ],
    tags: ['shell theorem', 'shm', 'calculus'],
    free: false,
  },
]
