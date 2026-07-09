import type { Discipline } from '@/lib/community-data'

// SCOPED OVERRIDE — founder-risky-edits branch only (09.07.2026). See
// DisciplineGroupCard.tsx and the commit message for the full context and
// readability critique; this is the literal "full-bleed photo per
// discipline" build for side-by-side comparison against main's icon-based
// version, not a recommendation to ship. Files are real photos pulled from
// Wikimedia Commons (public domain / CC-licensed) as stand-ins for real
// stock photography — see public/discipline-bg/CREDITS.md for per-image
// source + license + attribution before this goes anywhere near production.
export const DISCIPLINE_BG: Record<Discipline, string> = {
  Aerospace: '/discipline-bg/aerospace.jpg',
  Mechanical: '/discipline-bg/mechanical.jpg',
  Electrical: '/discipline-bg/electrical.jpg',
  Software: '/discipline-bg/software.jpg',
  Civil: '/discipline-bg/civil.jpg',
  Chemical: '/discipline-bg/chemical.jpg',
  Biomedical: '/discipline-bg/biomedical.jpg',
  Materials: '/discipline-bg/materials.jpg',
  Environmental: '/discipline-bg/environmental.jpg',
  Other: '/discipline-bg/other.jpg',
}

export function getDisciplineBg(discipline: string): string {
  return DISCIPLINE_BG[discipline as Discipline] ?? DISCIPLINE_BG.Other
}
