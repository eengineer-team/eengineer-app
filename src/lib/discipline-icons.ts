import {
  Rocket,
  Cog,
  Zap,
  Code2,
  Building2,
  FlaskConical,
  HeartPulse,
  Layers,
  Leaf,
  Boxes,
  type LucideIcon,
} from 'lucide-react'
import type { Discipline } from '@/lib/community-data'

// Specifically-chosen icon per discipline — deliberately not a single generic
// mark reused everywhere (see DisciplineMotif, which is the older approach).
// Colors still come from discipline-colors.ts; this only decides which
// pictogram represents each field of study.
const DISCIPLINE_ICONS: Record<Discipline, LucideIcon> = {
  Aerospace: Rocket,
  Mechanical: Cog,
  Electrical: Zap,
  Software: Code2,
  Civil: Building2,
  Chemical: FlaskConical,
  Biomedical: HeartPulse,
  Materials: Layers,
  Environmental: Leaf,
  Other: Boxes,
}

export function getDisciplineIcon(discipline: Discipline): LucideIcon {
  return DISCIPLINE_ICONS[discipline] ?? Boxes
}
