export interface Competition {
  id: string
  name: string
  location: string
  remote: boolean
  discipline: string
  organizer: string
  description: string
  requirements: string[]
  deadline: Date
}

// Seed data with REAL deadlines (was: daysFromToday() fakes — anyone could
// google Conrad's actual dates, and a verifiable lie on the landing kills
// trust faster than an empty calendar). Dates below researched 2026-07-09;
// each entry's comment says how solid its date is. Long-term source is
// edugrants (founder integrating) — shape is designed so CompetitionDetail
// can accept a real API object without changing the page.

export const SEED_COMPETITIONS: Competition[] = [
  {
    id: 'comp1',
    name: 'Conrad Challenge',
    location: 'International',
    remote: true,
    discipline: 'All disciplines',
    organizer: 'Conrad Challenge Foundation',
    description:
      'A year-long innovation competition where student teams design a product or service addressing a real-world problem across categories spanning aerospace, cyber, energy, and more.',
    requirements: [
      'Team of 2–5 students, ages 13–18',
      'Original concept — not a prior year resubmission',
      'Written proposal and pitch deck at each submission stage',
    ],
    // 2026-27 (20th anniversary) cycle opens August 2026 per conradchallenge.org;
    // exact stage deadlines TBA. Oct 30 = Activation Stage close in the 2025-26
    // cycle (Aug 28 – Oct 30) — same cadence assumed. VERIFY when cycle opens.
    deadline: new Date(2026, 9, 30),
  },
  {
    id: 'comp2',
    name: 'MIT Beaverworks Summer Institute',
    location: 'Cambridge, MA',
    remote: false,
    discipline: 'Robotics / Aerospace',
    organizer: 'MIT Lincoln Laboratory Beaver Works Center',
    description:
      'A four-week residential program where high school students build autonomous systems (UAVs or medical devices) under the mentorship of MIT researchers and engineers.',
    requirements: [
      'Rising junior or senior in high school',
      'Prior coursework or project experience in programming (Python or C++)',
      'Teacher recommendation and application essay',
    ],
    // Summer 2027 cohort: application deadline April 15, 2027 (bwsi.mit.edu);
    // prerequisite-course registration opens early December 2026.
    deadline: new Date(2027, 3, 15),
  },
  {
    id: 'comp3',
    name: "NASA L'SPACE Academy",
    location: 'Remote',
    remote: true,
    discipline: 'Aerospace / Systems',
    organizer: 'NASA / Arizona State University',
    description:
      'A semester-long, remote-only program simulating a real aerospace engineering proposal team, culminating in a mission concept review with NASA subject matter experts.',
    requirements: [
      'High school student, 16 years or older',
      'Interest in systems engineering or mission design',
      'Reliable internet access for weekly virtual team meetings',
    ],
    // Fall 2026 academy: official lspace.asu.edu applications page is stale
    // (still shows 2021); Aug 25 matches the program's historical fall cadence.
    // UNVERIFIED — confirm with lspace.asu.edu / LSPACE@asu.edu before launch.
    deadline: new Date(2026, 7, 25),
  },
]

export function getCompetition(id: string): Competition | undefined {
  return SEED_COMPETITIONS.find((c) => c.id === id)
}
