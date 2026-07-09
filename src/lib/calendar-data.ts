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

// Mock data — relative to "today" so the calendar always has upcoming deadlines to show.
// Real data source is edugrants (founder integrating) — shape below is designed
// so CompetitionDetail can accept a real API object without changing the page.
function daysFromToday(days: number): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + days)
  return d
}

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
    deadline: daysFromToday(3),
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
    deadline: daysFromToday(18),
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
    deadline: daysFromToday(34),
  },
]

export function getCompetition(id: string): Competition | undefined {
  return SEED_COMPETITIONS.find((c) => c.id === id)
}
