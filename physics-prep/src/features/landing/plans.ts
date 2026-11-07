// Single source for what Free and Pro include, so the landing summary and /pro never disagree.

export const PRO_PRICE = '$8'

export const FREE_FEATURES = [
  'Free-body diagram builder',
  'Motion simulator',
  'Starter problems with step-by-step solutions',
  '5 AI tutor questions a day',
]

export const PRO_FEATURES = [
  'Everything in Free',
  'The full original problem bank, all seven units',
  'Timed, full-length mock exams',
  'Unlimited AI tutor questions',
  'Progress reports by unit and skill',
]

/** true = included, false = not included, string = included with a qualifier. */
export type Cell = boolean | string

export const COMPARISON: Array<{ feature: string; free: Cell; pro: Cell }> = [
  { feature: 'Free-body diagram builder', free: true, pro: true },
  { feature: 'Motion simulator', free: true, pro: true },
  { feature: 'Original practice problems', free: 'Starter set', pro: 'Full bank' },
  { feature: 'Step-by-step solutions', free: true, pro: true },
  { feature: 'AI tutor (guiding questions)', free: '5 a day', pro: 'Unlimited' },
  { feature: 'Timed mock exams', free: false, pro: true },
  { feature: 'Progress reports', free: false, pro: true },
]
