import type { Discipline } from '@/lib/community-data'

// One representative photo per discipline for the Community hub cards
// (founder feedback: "a general picture", blurred/tinted like AP Students'
// course cards — see DisciplineGroupCard.tsx). Hosted on Unsplash's CDN
// rather than bundled locally: every photo below is confirmed "Free to use
// under the Unsplash License" (no attribution required, commercial use
// permitted) as of the photo's own Unsplash page — avoids the licensing/
// CREDITS.md bookkeeping a prior local-asset attempt at this same feature
// needed. `w=600&q=60` keeps each card's payload small; the card only ever
// renders a 96px-tall banner.
const DISCIPLINE_BG: Record<Discipline, string> = {
  // Saturn V launch, NASA — unsplash.com/photos/coEJ3MW8jV8
  Aerospace: 'https://images.unsplash.com/photo-1614728994041-9a7ce006c57e?w=600&q=60&auto=format&fit=crop',
  // Close-up gear train — unsplash.com/photos/Wqc_tlCmzHI
  Mechanical: 'https://images.unsplash.com/photo-1701448150058-43d6d199b103?w=600&q=60&auto=format&fit=crop',
  // Power transmission lines — unsplash.com/photos/xmZ5tkZKwyc
  Electrical: 'https://images.unsplash.com/photo-1704213198493-0ccd05a97af4?w=600&q=60&auto=format&fit=crop',
  // Code on a monitor — unsplash.com/photos/ieic5Tq8YMk
  Software: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600&q=60&auto=format&fit=crop',
  // Steel bridge structure — unsplash.com/photos/bzeX7usSOmo
  Civil: 'https://images.unsplash.com/photo-1744042398115-e48fcfbeffc3?w=600&q=60&auto=format&fit=crop',
  // Test tubes with colored liquids — unsplash.com/photos/-lulun7F32c
  Chemical: 'https://images.unsplash.com/photo-1694230155228-cdde50083573?w=600&q=60&auto=format&fit=crop',
  // Medical instruments — unsplash.com/photos/NGiuYCI6phY
  Biomedical: 'https://images.unsplash.com/photo-1720180244462-648c13ee01e5?w=600&q=60&auto=format&fit=crop',
  // Brushed metal surface — unsplash.com/photos/k-jMzM6E9vg
  Materials: 'https://images.unsplash.com/photo-1756758932992-3cac25c395f7?w=600&q=60&auto=format&fit=crop',
  // Aerial solar panel field — unsplash.com/photos/Ilpf2eUPpUE
  Environmental: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=600&q=60&auto=format&fit=crop',
  // Drafting a blueprint — unsplash.com/photos/-FPFq_trr2Y
  Other: 'https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=600&q=60&auto=format&fit=crop',
}

export function getDisciplineBg(discipline: Discipline): string {
  return DISCIPLINE_BG[discipline] ?? DISCIPLINE_BG.Other
}
