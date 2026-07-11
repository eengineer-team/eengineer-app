import type { Discipline } from '@/lib/community-data'

export interface Opportunity {
  id: string
  title: string
  org: string
  discipline: Discipline | 'All disciplines'
  location: string
  deadline: string
  /** Real calendar date backing the `deadline` display string — used by the
   *  Calendar's month/year views to place this listing on a specific day.
   *  Omitted for genuinely rolling programs (no single annual deadline). */
  deadlineDate?: Date
  /** Short overview shown on the detail page, above Requirements/Responsibilities. */
  description: string
  /** Hero image for the detail page — free-to-use Unsplash photo, themed to the role. */
  image: string
  requirements: string[]
  responsibilities: string[]
  source: 'edugrants'
  /** The org's real careers/students page — never a fabricated per-posting
   *  URL (same "no verifiable lies" rule as the calendar's real deadlines).
   *  Omitted for the one edugrants-run fellowship, which has no outside site. */
  applyUrl?: string
}

// Mock edugrants feed — real integration swaps this array for an API call,
// the credit requirement and card shape stay the same either way.
//
// Founder note (2026-07-11): the original 5 company internships here (Boom
// Supersonic, Skydio, Anduril, Rivian, AECOM) were US-based roles that in
// practice require US citizenship or work authorization -- Anduril/Boom in
// particular are ITAR-restricted. That's a dead end for our actual audience
// (Uzbekistan / Central Asia), so they're replaced below with real programs
// that explicitly accept Uzbek/international applicants: IAESTE, DAAD EPOS,
// Turkiye Burslari, the El-Yurt Umidi presidential scholarship, and Chevening.
// The edugrants-run fellowship (op6) is untouched -- it was never nationality-
// restricted.
export const SEED_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'op1',
    title: 'IAESTE Technical Internship Exchange',
    org: 'IAESTE',
    discipline: 'All disciplines',
    location: 'International (paid placement)',
    deadline: 'Rolling — apply each semester via the Uzbekistan committee',
    description: 'IAESTE is the world\'s largest paid technical-internship exchange, matching engineering and STEM students with placements abroad in fields spanning mechanical, civil, chemical, and computer engineering. Uzbekistan is a member country — students nominate through the national committee rather than applying to a single employer, and every placement is paid at least enough to cover food, housing, and local travel.',
    // Photo by Vitaly Gariev on Unsplash — https://unsplash.com/photos/diverse-group-of-students-collaborating-around-a-laptop--X4Qx4_4iMU — Free to use under the Unsplash License.
    image: 'https://images.unsplash.com/photo-1758270705518-b61b40527e76?w=1200&q=70&auto=format&fit=crop',
    requirements: ['Enrolled full-time in a Bachelor\'s or Master\'s program (engineering, CS, or related STEM field)', 'Nomination through your home country\'s IAESTE committee — Uzbekistan is a member country', 'Basic English or the host country\'s working language, depending on placement'],
    responsibilities: ['Register on the IAESTE Exchange Platform and submit a nomination', 'Complete required documents: CV, transcript, enrollment certificate, and recommendation letter', 'Take on a real paid technical role for the placement term (typically 8–52 weeks)'],
    source: 'edugrants',
    applyUrl: 'https://iaeste.org/member-countries/uzbekistan',
  },
  {
    id: 'op2',
    title: 'DAAD EPOS Scholarship — Engineering Master\'s',
    org: 'DAAD (German Academic Exchange Service)',
    discipline: 'Civil',
    location: 'Germany (fully funded master\'s)',
    deadline: 'Applications close Aug 31',
    deadlineDate: new Date(2026, 7, 31),
    description: 'DAAD\'s Development-Related Postgraduate Courses (EPOS) program funds master\'s and PhD study in Germany for students from Eastern Europe and Central Asia, including Uzbekistan. Engineering-relevant tracks include Structural Engineering, Urban Management, and Renewable Energy — funding covers tuition, a monthly stipend (~€992), travel, and health insurance.',
    // Photo by Teymur Mammadov on Unsplash — https://unsplash.com/photos/a-view-of-a-city-from-a-rooftop-eGjSDbIkirg — Free to use under the Unsplash License.
    image: 'https://images.unsplash.com/photo-1643212574731-ad8582a4c493?w=1200&q=70&auto=format&fit=crop',
    requirements: ['Bachelor\'s degree in engineering or a related field, completed within the last 6 years', 'At least 2 years of relevant professional experience for most tracks', 'Uzbekistan is an eligible country under DAAD\'s Central Asia region'],
    responsibilities: ['Apply directly to your chosen course\'s host university, not to DAAD centrally', 'Submit transcripts, references, and a motivation letter per the program\'s own deadline', 'Attend the full master\'s or PhD program in Germany if selected'],
    source: 'edugrants',
    applyUrl: 'https://www.daad.de/en/information-services-for-higher-education-institutions/further-information-on-daad-programmes/epos/',
  },
  {
    id: 'op3',
    title: 'Turkiye Burslari (Turkiye Scholarships) — Engineering',
    org: 'Turkiye Scholarships / Turkish Government',
    discipline: 'All disciplines',
    location: 'Turkiye (fully funded, bachelor\'s–PhD)',
    // 2026 cycle applications ran Jan 10 – Feb 25 (extended); next cycle's
    // exact window isn't published yet. Assumed same cadence — VERIFY on
    // turkiyeburslari.gov.tr before the window opens.
    deadline: 'Applications typically open Jan–Feb (2027 cycle dates TBA)',
    deadlineDate: new Date(2027, 1, 20),
    description: 'Turkiye Burslari is the Turkish government\'s fully funded scholarship for international students, open to bachelor\'s, master\'s, and doctoral applicants — Uzbekistan students are explicitly eligible. Engineering is one of the largest fields covered, with placements across Turkey\'s top public universities. Funding includes tuition, monthly stipend, housing, health insurance, and a Turkish-language prep year if needed.',
    // Photo by Spenser Sembrat on Unsplash — https://unsplash.com/photos/view-of-istanbul-skyline-with-mosques-and-bosphorus-strait-UM_YUJUGK6g — Free to use under the Unsplash License.
    image: 'https://images.unsplash.com/photo-1763965367191-6455ef032c79?w=1200&q=70&auto=format&fit=crop',
    requirements: ['Uzbek or other international citizenship (not a Turkish citizen)', 'Minimum GPA thresholds by degree level (check current cycle\'s announcement)', 'Under the age limit for your chosen degree level (undergrad/master\'s/PhD cutoffs differ)'],
    responsibilities: ['Apply online through the Turkiye Scholarships portal during the application window', 'Rank preferred universities and engineering programs', 'Complete a Turkish-language preparatory year if your program requires it'],
    source: 'edugrants',
    applyUrl: 'https://tbbs.turkiyeburslari.gov.tr/',
  },
  {
    id: 'op4',
    title: 'El-Yurt Umidi Presidential Scholarship',
    org: 'El-Yurt Umidi Foundation (Uzbekistan)',
    discipline: 'All disciplines',
    location: 'Study abroad — top 300 QS-ranked universities',
    // Historical window is Apr 15 – May 15 each year; next cycle's exact
    // dates aren't published yet on eyuf.uz. Assumed same cadence — VERIFY
    // before the window opens.
    deadline: 'Applications typically open Apr 15 – May 15 (2027 cycle TBA)',
    deadlineDate: new Date(2027, 4, 15),
    description: 'El-Yurt Umidi is the Uzbek government\'s own presidential scholarship fund, sending Uzbek students abroad for bachelor\'s, master\'s, and PhD study at universities ranked in the global top 300 (QS, THE, ARWU, or top 100 in your specific field) — engineering disciplines are fully eligible. Selection runs through a national competition: testing, interviews, and an assessment of intellectual and creative ability.',
    // Photo by Nosirjon Saminjonov on Unsplash — https://unsplash.com/photos/a-large-building-with-many-windows-and-arches-eQTJeaaukI4 — Free to use under the Unsplash License. (Registan, Samarkand)
    image: 'https://images.unsplash.com/photo-1636308625150-79a17ded193d?w=1200&q=70&auto=format&fit=crop',
    requirements: ['Uzbek citizenship', 'Admission (or a plan to secure admission) to a university in the global top 300, or top 100 in your specific engineering field', 'Pass the Fund\'s competitive testing and interview stages'],
    responsibilities: ['Submit an application through the Fund\'s official site during the annual window', 'Complete testing and interview stages assessing academic readiness', 'Maintain the Fund\'s academic standards for the duration of the scholarship'],
    source: 'edugrants',
    applyUrl: 'https://eyuf.uz',
  },
  {
    id: 'op5',
    title: 'Chevening Scholarship — Master\'s in the UK',
    org: 'Chevening (UK Foreign, Commonwealth & Development Office)',
    discipline: 'All disciplines',
    location: 'United Kingdom (fully funded master\'s)',
    deadline: 'Applications close Oct 6',
    deadlineDate: new Date(2026, 9, 6),
    description: 'Chevening is the UK government\'s flagship scholarship for future leaders, funding a one-year master\'s degree at any UK university — including engineering programs. Uzbekistan has its own active Chevening alumni network. Awards cover tuition, a monthly stipend, and travel to and from the UK.',
    // Photo by Alex Ghiurau on Unsplash — https://unsplash.com/photos/big-ben-clock-tower-and-westminster-bridge-over-river-thames-A94gGLeFd68 — Free to use under the Unsplash License.
    image: 'https://images.unsplash.com/photo-1758543144598-9d954f44799a?w=1200&q=70&auto=format&fit=crop',
    requirements: ['Uzbek citizenship (or another Chevening-eligible country)', 'At least 2 years of full-time work experience after your undergraduate degree', 'An undergraduate degree that qualifies you for a UK master\'s program, plus 3 course choices'],
    responsibilities: ['Apply online during the annual application window (opens each August)', 'Complete interviews if shortlisted by the local British Embassy panel', 'Return to Uzbekistan after the master\'s to apply what you\'ve learned, per Chevening\'s program terms'],
    source: 'edugrants',
    applyUrl: 'https://www.chevening.org/scholarship/uzbekistan/',
  },
  {
    id: 'op6',
    title: 'Cross-Discipline Systems Engineering Fellowship',
    org: 'edugrants Foundation',
    discipline: 'All disciplines',
    location: 'Remote',
    deadline: 'Applications close Sep 1',
    deadlineDate: new Date(2026, 8, 1),
    description: "A cross-discipline fellowship run directly by the edugrants Foundation rather than a single partner company. Fellows shadow systems engineers across several partner companies at once, producing requirement-traceability writeups for real subsystems — good preparation for anyone whose project work already spans more than one discipline.",
    // Photo by Jennifer Kalenberg on Unsplash — https://unsplash.com/photos/a-group-of-young-women-in-graduation-gowns-throwing-their-caps-in-the-air-ERhT6XcHTH8 — Free to use under the Unsplash License.
    image: 'https://images.unsplash.com/photo-1695425173758-37e9c23b962a?w=1200&q=70&auto=format&fit=crop',
    requirements: ['Any engineering discipline, sophomore standing or above', 'Demonstrated project work spanning more than one subsystem', 'Strong written communication — the fellowship is documentation-heavy'],
    responsibilities: ['Shadow systems engineers across partner companies', 'Produce requirement-traceability writeups for a real subsystem', 'Present findings at the fellowship capstone review'],
    source: 'edugrants',
  },
]

// Rule-based matching: listings for the Builder's discipline (or open to
// "All disciplines") sort first. This is the interim scorer called out in the
// spec — swap the sort key for a real ML match score once project-history
// data (Profiles, Step 9) exists, the card shape and "Matched for you" badge
// don't need to change.
export function rankByDiscipline(opportunities: Opportunity[], discipline: Discipline | null): Opportunity[] {
  if (!discipline) return opportunities
  return [...opportunities].sort((a, b) => {
    const aMatch = a.discipline === discipline || a.discipline === 'All disciplines'
    const bMatch = b.discipline === discipline || b.discipline === 'All disciplines'
    if (aMatch === bMatch) return 0
    return aMatch ? -1 : 1
  })
}

export function isMatch(opportunity: Opportunity, discipline: Discipline | null): boolean {
  if (!discipline) return false
  return opportunity.discipline === discipline || opportunity.discipline === 'All disciplines'
}

export function getOpportunity(id: string): Opportunity | undefined {
  return SEED_OPPORTUNITIES.find((o) => o.id === id)
}
