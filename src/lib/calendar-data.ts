export interface Competition {
  id: string
  name: string
  location: string
  discipline: string
  deadline: Date
}

// Mock data — relative to "today" so the calendar always has upcoming deadlines to show.
// Real data source (partner API / backend) lands post-MVP.
function daysFromToday(days: number): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + days)
  return d
}

export const SEED_COMPETITIONS: Competition[] = [
  { id: 'comp1', name: 'Conrad Challenge', location: 'International', discipline: 'All disciplines', deadline: daysFromToday(3) },
  { id: 'comp2', name: 'MIT Beaverworks Summer Institute', location: 'Cambridge, MA', discipline: 'Robotics / Aerospace', deadline: daysFromToday(18) },
  { id: 'comp3', name: "NASA L'SPACE Academy", location: 'Remote', discipline: 'Aerospace / Systems', deadline: daysFromToday(34) },
]
