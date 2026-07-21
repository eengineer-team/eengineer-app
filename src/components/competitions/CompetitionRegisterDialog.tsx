import * as React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LabelCaps } from '@/components/ui/label-caps'
import type { CompetitionRegistration } from '@/lib/api/competitions'

// Real registration, not a one-click toggle -- Register / Apply used to just
// flip a local boolean with nothing saved anywhere. Name/email are prefilled
// from the signed-in Builder but editable (someone might register under a
// team lead's contact instead of their own), team/school is always blank.
export function CompetitionRegisterDialog({
  competitionName,
  defaultName,
  defaultEmail,
  submitting,
  error,
  onSubmit,
  onClose,
}: {
  competitionName: string
  defaultName: string
  defaultEmail: string
  submitting: boolean
  error: string | null
  onSubmit: (reg: CompetitionRegistration) => void
  onClose: () => void
}) {
  const [name, setName] = React.useState(defaultName)
  const [email, setEmail] = React.useState(defaultEmail)
  const [teamSchool, setTeamSchool] = React.useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const trimmedTeam = teamSchool.trim()
    if (!trimmedName || !trimmedEmail || !trimmedTeam) return
    onSubmit({ name: trimmedName, email: trimmedEmail, teamSchool: trimmedTeam })
  }

  const canSubmit = name.trim() && email.trim() && teamSchool.trim() && !submitting

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={submitting ? undefined : onClose}
        aria-hidden="true"
      />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-[420px] bg-dark-100 border border-white/12 rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.5)] p-5"
      >
        <div className="flex items-center justify-between mb-1">
          <LabelCaps>Register for {competitionName}</LabelCaps>
          <button
            type="button"
            onClick={onClose}
            className="text-dark-muted hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>
        <p className="font-sans text-[0.75rem] text-dark-muted mb-4">
          We'll pass this along to the organizer.
        </p>

        <div className="flex flex-col gap-3 mb-4">
          <div>
            <LabelCaps className="block mb-1.5">Name</LabelCaps>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2.5 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25"
              placeholder="Your name"
            />
          </div>
          <div>
            <LabelCaps className="block mb-1.5">Email</LabelCaps>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2.5 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <LabelCaps className="block mb-1.5">Team / School</LabelCaps>
            <input
              value={teamSchool}
              onChange={(e) => setTeamSchool(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2.5 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25"
              placeholder="e.g. Lincoln High School Robotics"
            />
          </div>
        </div>

        {error && (
          <p className="font-sans text-[0.8125rem] text-red-400 mb-3" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="shell" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="accent" size="sm" disabled={!canSubmit}>
            {submitting ? 'Registering…' : 'Register'}
          </Button>
        </div>
      </form>
    </div>
  )
}
