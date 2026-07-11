import type { Discipline } from '@/lib/community-data'
import type { Attachment } from '@/lib/attachments'

// "Currently working on" feed — a lightweight, running status feed distinct
// from Project (projects-data.ts, one long-lived venture per Builder). This
// is for the small day-to-day "what are you building right now" update, so
// it can have as many posts as a Builder wants and never needs a name/
// description/team the way a Project does.
export interface CurrentActivity {
  id: string
  authorId: string
  name: string
  discipline: Discipline
  text: string
  time: string
  attachment?: Attachment
}

export const SEED_CURRENT_ACTIVITY: CurrentActivity[] = [
  {
    id: 'ca1',
    authorId: 'n-alex',
    name: 'Alex Kim',
    discipline: 'Aerospace',
    text: 'Debugging the fin-actuator PID loop — overshoot on the step response is still ~8%, tuning the D term tonight before the next bench test.',
    time: '2h ago',
  },
  {
    id: 'ca2',
    authorId: 'n1',
    name: 'Marcus R.',
    discipline: 'Software',
    text: 'Migrating the telemetry dashboard off polling onto a websocket feed — latency dropped from ~2s to under 100ms.',
    time: '5h ago',
  },
]
