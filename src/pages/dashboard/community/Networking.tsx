import * as React from 'react'
import { SEED_INTRODUCTIONS, type Discipline, type Introduction } from '@/lib/community-data'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { LabelCaps } from '@/components/ui/label-caps'

// `discipline` scopes the feed to one group's members (Community hub → group
// space); omit for a global "Networking" view. Introductions are posted
// content, not a connect/status row — kept as a separate model from
// NetworkProfile (see community-data.ts) so this can't get tangled with the
// Members connect-request flow.
export function Networking({ discipline }: { discipline?: Discipline } = {}) {
  const [intros, setIntros] = React.useState<Introduction[]>(SEED_INTRODUCTIONS)
  const [draft, setDraft] = React.useState('')
  const [editing, setEditing] = React.useState(false)

  const scoped = discipline ? intros.filter((i) => i.discipline === discipline) : intros
  const mine = scoped.find((i) => i.authorId === 'me')
  const others = scoped.filter((i) => i.authorId !== 'me')

  function post() {
    const text = draft.trim()
    if (!text) return
    setIntros((prev) => {
      const existing = prev.find((i) => i.authorId === 'me')
      if (existing) {
        return prev.map((i) => (i.authorId === 'me' ? { ...i, text, time: 'Just now' } : i))
      }
      return [
        ...prev,
        {
          id: `i-${Date.now()}`,
          authorId: 'me',
          name: 'You',
          discipline: discipline ?? 'Other',
          text,
          time: 'Just now',
        },
      ]
    })
    setDraft('')
    setEditing(false)
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <LabelCaps className="block mb-3">Your introduction</LabelCaps>
        {mine && !editing ? (
          <div className="bg-white/[0.03] border border-white/8 rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <p className="font-sans text-[0.875rem] text-dark-text leading-snug">{mine.text}</p>
              <button
                onClick={() => {
                  setDraft(mine.text)
                  setEditing(true)
                }}
                className="flex-shrink-0 font-sans text-[12px] text-dark-muted hover:text-white/80 transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
        ) : (
          <div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              placeholder="Introduce yourself — who you are, what you're building, and what you're into."
              className="w-full bg-white/5 border border-white/10 rounded px-3.5 py-2.5 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25 resize-none mb-2"
            />
            <div className="flex gap-2">
              <Button variant="accent" size="sm" onClick={post} disabled={!draft.trim()}>
                Post introduction
              </Button>
              {editing && (
                <Button
                  variant="shell"
                  size="sm"
                  onClick={() => {
                    setEditing(false)
                    setDraft('')
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <div>
        <LabelCaps className="block mb-3">Introductions</LabelCaps>
        {others.length === 0 ? (
          <p className="font-sans text-[0.8125rem] text-dark-muted">
            {discipline ? `No introductions in ${discipline} yet.` : 'No introductions yet.'}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {others.map((i) => (
              <div key={i.id} className="bg-white/[0.03] border border-white/8 rounded-lg p-4 flex gap-3">
                <Avatar name={i.name} size="md" theme="dashboard" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="font-sans text-[0.875rem] font-semibold text-dark-text">{i.name}</div>
                    <span className="font-sans text-[10px] text-dark-muted flex-shrink-0">{i.time}</span>
                  </div>
                  <div className="font-sans text-[0.75rem] text-dark-muted mb-2">{i.discipline}</div>
                  <p className="font-sans text-[0.8125rem] text-dark-text leading-snug">{i.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
