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
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import type { Discipline } from '@/lib/community-data'

// One representative icon per discipline — used as a large, faded watermark
// background on Community hub cards/group pages (per founder feedback: "a
// picture of like faded out rocket... different to each discipline"). Real
// photography would need per-discipline sourcing/licensing; a big low-opacity
// icon gets the same "themed background" effect using the icon set already
// in the project, so it stays visually consistent with the rest of the app.
export const DISCIPLINE_ICONS: Record<Discipline, LucideIcon> = {
  Aerospace: Rocket,
  Mechanical: Cog,
  Electrical: Zap,
  Software: Code2,
  Civil: Building2,
  Chemical: FlaskConical,
  Biomedical: HeartPulse,
  Materials: Layers,
  Environmental: Leaf,
  Other: Sparkles,
}

export function getDisciplineIcon(discipline: string): LucideIcon {
  return DISCIPLINE_ICONS[discipline as Discipline] ?? Sparkles
}
