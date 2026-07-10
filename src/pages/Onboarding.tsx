import * as React from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { ArrowRight, Camera, X } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useProfiles } from '@/lib/profiles-context'
import { ME_ID } from '@/lib/profile-data'
import { DISCIPLINES, type Discipline } from '@/lib/community-data'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/ui/wordmark'
import { Avatar } from '@/components/ui/avatar'
import { LabelCaps } from '@/components/ui/label-caps'
import { cn } from '@/lib/utils'

// Step 13 — real profile-setup flow, reached from Auth.tsx right after a
// signup-mode OAuth mock (login-mode skips straight to /dashboard, see
// Auth.tsx). Writes directly into the shared ProfilesProvider state (see
// App.tsx — it now wraps /onboarding too, not just /dashboard) so there's no
// separate "draft" profile that needs merging in later.
//
// Everything here is skippable — nothing blocks reaching the dashboard. Per
// spec this is a mock/demo product with no real backend yet, so forcing
// completion would just create a dead end for anyone who doesn't want to
// fill it in right now.
export function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { getProfile, setAvatar, setDiscipline, setBio, setInterests, setOpenToWork, addExperience } = useProfiles()
  const profile = getProfile(ME_ID)

  const [avatarPreview, setAvatarPreview] = React.useState<string | undefined>(undefined)
  const [discipline, setDisciplineDraft] = React.useState<Discipline>(profile?.discipline ?? 'Aerospace')
  const [bio, setBioDraft] = React.useState('')
  const [interests, setInterestsDraft] = React.useState<string[]>([])
  const [interestInput, setInterestInput] = React.useState('')
  const [openToWork, setOpenToWorkDraft] = React.useState(false)
  const [role, setRole] = React.useState('')
  const [organization, setOrganization] = React.useState('')
  const [duration, setDuration] = React.useState('')
  const [expDescription, setExpDescription] = React.useState('')

  // Only a freshly-signed-in Builder should land here — anyone else (no
  // session, or a stateless Google preview) has no ME profile to write into.
  if (!user || user.status !== 'builder') return <Navigate to="/auth" replace />

  function addInterest() {
    const trimmed = interestInput.trim()
    if (!trimmed || interests.includes(trimmed)) {
      setInterestInput('')
      return
    }
    setInterestsDraft((prev) => [...prev, trimmed])
    setInterestInput('')
  }

  function removeInterest(name: string) {
    setInterestsDraft((prev) => prev.filter((i) => i !== name))
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setAvatarPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  function finish() {
    if (avatarPreview) setAvatar(avatarPreview)
    setDiscipline(discipline)
    if (bio.trim()) setBio(bio.trim())
    setInterests(interests)
    setOpenToWork(openToWork)
    if (role.trim()) {
      addExperience({
        role: role.trim(),
        organization: organization.trim() || 'Independent',
        duration: duration.trim() || 'Present',
        description: expDescription.trim(),
      })
    }
    navigate('/dashboard')
  }

  const inputClass =
    'w-full bg-white/50 border border-corn-900/15 rounded px-4 py-2.5 font-sans text-sm text-[#2A2118] placeholder:text-corn-800/40 focus:outline-none focus:border-corn-700/50'

  return (
    <div className="min-h-screen bg-corn-100 flex flex-col items-center px-5 sm:px-10 py-10 sm:py-14">
      <div className="w-full max-w-[560px]">
        <Wordmark variant="light" className="mb-6" />

        <span className="font-sans text-[10px] font-medium tracking-[0.22em] uppercase text-corn-700 mb-3 block">
          Welcome, Builder
        </span>
        <h1 className="font-display font-bold text-[#2A2118] text-[clamp(1.75rem,3.2vw,2.25rem)] leading-[1.1] tracking-[-0.02em] mb-2">
          Set up your profile
        </h1>
        <p className="font-sans text-[0.875rem] leading-[1.6] text-corn-800 mb-8">
          Takes about a minute. Everything here is optional and can be changed later from your
          profile page — skip it if you'd rather jump straight in.
        </p>

        <div className="flex flex-col gap-7">
          {/* Photo */}
          <div>
            <LabelCaps theme="welcome" className="block mb-2.5">Photo</LabelCaps>
            <div className="flex items-center gap-4">
              <Avatar name={user.name} src={avatarPreview} theme="welcome" size="lg" />
              <label className="inline-flex items-center gap-2 cursor-pointer font-sans text-[0.8125rem] font-medium text-corn-900 border border-corn-900/20 rounded px-3.5 py-2 hover:bg-corn-900/5 transition-colors">
                <Camera size={14} strokeWidth={1.8} />
                {avatarPreview ? 'Change photo' : 'Upload photo'}
                <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
              </label>
            </div>
          </div>

          {/* Discipline */}
          <div>
            <LabelCaps theme="welcome" className="block mb-2.5">Discipline</LabelCaps>
            <div className="flex flex-wrap gap-1.5">
              {DISCIPLINES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDisciplineDraft(d)}
                  className={cn(
                    'font-sans text-[0.8125rem] rounded-sm px-3 py-1.5 border transition-colors duration-150',
                    discipline === d
                      ? 'bg-corn-900 border-corn-900 text-corn-100'
                      : 'border-corn-900/20 text-corn-900/70 hover:border-corn-900/40 hover:text-corn-900'
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div>
            <LabelCaps theme="welcome" className="block mb-2.5">About you</LabelCaps>
            <textarea
              value={bio}
              onChange={(e) => setBioDraft(e.target.value)}
              rows={3}
              placeholder="What are you building, and what are you into?"
              className={cn(inputClass, 'resize-none')}
            />
          </div>

          {/* Interests */}
          <div>
            <LabelCaps theme="welcome" className="block mb-2.5">Interests</LabelCaps>
            {interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {interests.map((i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 bg-corn-900/6 border border-corn-900/15 font-sans text-[0.75rem] text-corn-900"
                  >
                    {i}
                    <button type="button" onClick={() => removeInterest(i)} aria-label={`Remove ${i}`}>
                      <X size={11} strokeWidth={2} className="text-corn-800/60 hover:text-corn-900" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addInterest()
                  }
                }}
                placeholder="e.g. Rocketry, robotics, PCB design…"
                className={inputClass}
              />
              <Button type="button" variant="ghost" size="sm" onClick={addInterest} disabled={!interestInput.trim()}>
                Add
              </Button>
            </div>
          </div>

          {/* Experience — single optional entry, more can be added later from the profile page */}
          <div>
            <LabelCaps theme="welcome" className="block mb-2.5">Experience (optional)</LabelCaps>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Role — e.g. Propulsion Intern"
                  className={inputClass}
                />
                <input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="When"
                  className={cn(inputClass, 'w-32 flex-shrink-0')}
                />
              </div>
              <input
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Organization"
                className={inputClass}
              />
              <textarea
                value={expDescription}
                onChange={(e) => setExpDescription(e.target.value)}
                rows={2}
                placeholder="What did you do?"
                className={cn(inputClass, 'resize-none')}
              />
            </div>
          </div>

          {/* Open to work */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <button
              type="button"
              role="switch"
              aria-checked={openToWork}
              onClick={() => setOpenToWorkDraft((v) => !v)}
              className={cn(
                'relative w-10 h-[22px] rounded-full flex-shrink-0 transition-colors duration-150',
                openToWork ? 'bg-corn-700' : 'bg-corn-900/15'
              )}
            >
              <span
                className={cn(
                  'absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-150',
                  openToWork ? 'translate-x-[18px]' : 'translate-x-0'
                )}
              />
            </button>
            <span className="font-sans text-[0.875rem] text-[#2A2118]">Open to work / internships</span>
          </label>
        </div>

        <div className="flex items-center gap-3 mt-10">
          <Button
            variant="primary"
            size="lg"
            onClick={finish}
            className="gap-2 font-sans text-[0.8125rem] font-semibold tracking-[0.05em] uppercase"
          >
            Save and continue
            <ArrowRight size={13} strokeWidth={2.5} />
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => navigate('/dashboard')}
            className="font-sans text-[0.8125rem] font-semibold tracking-[0.05em] uppercase"
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  )
}
