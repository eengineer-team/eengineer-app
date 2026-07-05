// Step 12 — Direct Messages. Mock in-memory thread data, same caveat as the
// rest of the app's un-backed features: swap for a real backend later, the
// shape (conversation -> messages[]) stays the same.

export interface DirectMessage {
  id: string
  from: 'me' | 'them'
  text: string
  time: string
}

export interface Conversation {
  id: string
  withName: string
  discipline: string
  unread: number
  messages: DirectMessage[]
}

export const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: 'dm1',
    withName: 'James O.',
    discipline: 'Mechanical',
    unread: 2,
    messages: [
      { id: 'm1', from: 'them', text: "Hey! Saw your comment on the FOS question — you said 2.5-3x, right?", time: '10:02 AM' },
      { id: 'm2', from: 'me', text: "Yeah, for PLA under repeated load I'd stay conservative. What's the load case?", time: '10:05 AM' },
      { id: 'm3', from: 'them', text: 'Cyclic bending on a robot arm joint, maybe 200 cycles a match.', time: '10:07 AM' },
      { id: 'm4', from: 'them', text: 'Also — are you going to the MIT Beaverworks thing?', time: '10:08 AM' },
    ],
  },
  {
    id: 'dm2',
    withName: 'Priya T.',
    discipline: 'Electrical',
    unread: 0,
    messages: [
      { id: 'm5', from: 'them', text: 'Thanks for the connect! Loved your current sensor writeup.', time: 'Yesterday' },
      { id: 'm6', from: 'me', text: 'Appreciate it — let me know if you want the schematic, happy to share.', time: 'Yesterday' },
    ],
  },
  {
    id: 'dm3',
    withName: 'Marcus R.',
    discipline: 'Software',
    unread: 0,
    messages: [
      { id: 'm7', from: 'me', text: 'Your monorepo template saved me a full weekend, seriously.', time: 'Mon' },
      { id: 'm8', from: 'them', text: 'Glad it helped! Ping me if the firmware/dashboard split gets weird.', time: 'Mon' },
    ],
  },
]
