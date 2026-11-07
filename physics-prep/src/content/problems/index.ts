import type { Problem } from '@/types/problem'
import { problemsUnits1to3 } from './units-1-3'
import { problemsUnits4to7 } from './units-4-7'

export const problems: Problem[] = [...problemsUnits1to3, ...problemsUnits4to7]

export function getProblem(id: string): Problem | undefined {
  return problems.find((p) => p.id === id)
}
