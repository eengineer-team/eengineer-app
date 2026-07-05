import type { Discipline } from '@/lib/community-data'

export interface Opportunity {
  id: string
  title: string
  org: string
  discipline: Discipline | 'All disciplines'
  location: string
  deadline: string
  requirements: string[]
  responsibilities: string[]
  source: 'edugrants'
}

// Mock edugrants feed — real integration swaps this array for an API call,
// the credit requirement and card shape stay the same either way.
export const SEED_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'op1',
    title: 'Propulsion Systems Intern',
    org: 'Boom Supersonic',
    discipline: 'Aerospace',
    location: 'Denver, CO',
    deadline: 'Applications close Aug 1',
    requirements: ['Junior/Senior standing in Aerospace or Mechanical Engineering', 'Coursework or project experience in thermodynamics or fluid dynamics', 'Proficiency with CAD (any major package)'],
    responsibilities: ['Support test-stand instrumentation for propulsion test campaigns', 'Reduce and plot test data alongside propulsion engineers', 'Document findings in weekly engineering reviews'],
    source: 'edugrants',
  },
  {
    id: 'op2',
    title: 'Firmware Engineering Intern',
    org: 'Skydio',
    discipline: 'Software',
    location: 'Remote',
    deadline: 'Applications close Jul 28',
    requirements: ['Comfortable in C/C++ and at least one scripting language', 'Familiarity with embedded systems or real-time constraints', 'A shipped personal or team project you can walk through'],
    responsibilities: ['Implement and test flight-controller firmware features', 'Pair with senior firmware engineers on code review', 'Write unit tests for new sensor-fusion modules'],
    source: 'edugrants',
  },
  {
    id: 'op3',
    title: 'Structures & Mechanisms Intern',
    org: 'Anduril Industries',
    discipline: 'Mechanical',
    location: 'Costa Mesa, CA',
    deadline: 'Applications close Aug 12',
    requirements: ['Sophomore standing or above in Mechanical/Aerospace Engineering', 'Hands-on fabrication experience (machine shop, 3D printing, or composites)', 'Basic FEA exposure a plus, not required'],
    responsibilities: ['Design and iterate on structural brackets and mechanisms', 'Run tolerance stack-ups for assembly fit checks', 'Support prototype build and bench testing'],
    source: 'edugrants',
  },
  {
    id: 'op4',
    title: 'Power Electronics Intern',
    org: 'Rivian',
    discipline: 'Electrical',
    location: 'Irvine, CA',
    deadline: 'Applications close Aug 5',
    requirements: ['Coursework in circuits, power electronics, or controls', 'Comfortable reading schematics and using a bench multimeter/oscilloscope', 'Prior robotics or EV club experience preferred'],
    responsibilities: ['Bring up and validate power-converter prototypes', 'Characterize thermal and efficiency performance on the bench', 'Support root-cause debug of field returns'],
    source: 'edugrants',
  },
  {
    id: 'op5',
    title: 'Infrastructure Design Intern',
    org: 'AECOM',
    discipline: 'Civil',
    location: 'Los Angeles, CA',
    deadline: 'Applications close Aug 15',
    requirements: ['Junior standing or above in Civil Engineering', 'Familiarity with AutoCAD Civil 3D or similar', 'Interest in transportation or water-resources infrastructure'],
    responsibilities: ['Support grading and drainage design calculations', 'Prepare drawing sets under PE supervision', 'Attend site visits and client coordination meetings'],
    source: 'edugrants',
  },
  {
    id: 'op6',
    title: 'Cross-Discipline Systems Engineering Fellowship',
    org: 'edugrants Foundation',
    discipline: 'All disciplines',
    location: 'Remote',
    deadline: 'Applications close Sep 1',
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
