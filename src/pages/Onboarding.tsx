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
// Whole-years age as of today from a "YYYY-MM-DD" birthdate string.
function ageFromBirthdate(birthdate: string): number | null {
  const parsed = new Date(birthdate)
  if (Number.isNaN(parsed.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - parsed.getFullYear()
  const hasHadBirthdayThisYear =
    now.getMonth() > parsed.getMonth() ||
    (now.getMonth() === parsed.getMonth() && now.getDate() >= parsed.getDate())
  if (!hasHadBirthdayThisYear) age -= 1
  return age
}

export function Onboarding() {
  const { user, updateName } = useAuth()
  const navigate = useNavigate()
  const {
    getProfile,
    setAvatar,
    setDiscipline,
    setBio,
    setInterests,
    setOpenToWork,
    addExperience,
    setBirthdate,
    setGuardianConsent,
  } = useProfiles()
  const profile = getProfile(ME_ID)

  const [name, setName] = React.useState(user?.status === 'builder' ? user.name : '')
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

  // Age gate — the one required field on this page (everything else stays
  // skippable per the founder's original "no dead ends" spec). Most Builders
  // signing up are, obviously, under 18, so this isn't an edge case: it's
  // the mainline path, and it has to actually block continuing rather than
  // being a checkbox someone can click past without reading.
  const [birthdate, setBirthdateDraft] = React.useState('')
  const [guardianEmail, setGuardianEmailDraft] = React.useState('')
  const [guardianConsentChecked, setGuardianConsentChecked] = React.useState(false)

  const age = birthdate ? ageFromBirthdate(birthdate) : null
  const isMinor = age !== null && age < 18
  const hasValidBirthdate = birthdate.trim() !== '' && age !== null
  const canProceed = hasValidBirthdate && (!isMinor || (guardianConsentChecked && guardianEmail.trim() !== ''))

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

  // Shared by both "Save and continue" and "Skip for now" — the age gate
  // isn't part of "everything else", so it's recorded regardless of which
  // button was used to leave this page.
  function recordAgeGate() {
    setBirthdate(birthdate)
    if (isMinor) setGuardianConsent(guardianEmail)
  }

  function finish() {
    if (!canProceed) return
    recordAgeGate()
    updateName(name.trim())
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

        <LabelCaps theme="welcome" className="mb-3 block">
          Welcome, Builder
        </LabelCaps>
        <h1 className="font-display font-bold text-[#2A2118] text-[clamp(1.75rem,3.2vw,2.25rem)] leading-[1.1] tracking-[-0.02em] mb-2">
          Set up your profile
        </h1>
        <p className="font-sans text-[0.875rem] leading-[1.6] text-corn-800 mb-8">
          Takes about a minute. Everything below is optional and can be changed later from your
          profile page, except your date of birth (required, once, right now) — skip the rest if
          you'd rather jump straight in.
        </p>

        <div className="flex flex-col gap-7">
          {/* Date of birth — required, gates everything below it */}
          <div>
            <LabelCaps theme="welcome" className="block mb-2.5">Date of birth (required)</LabelCaps>
            <input
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdateDraft(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className={inputClass}
            />
            {birthdate.trim() !== '' && age === null && (
              <p className="font-sans text-[12px] text-red-600 mt-1.5">That doesn't look like a valid date.</p>
            )}

            {isMinor && (
              <div className="mt-4 bg-corn-900/5 border border-corn-900/15 rounded-lg p-4">
                <p className="font-sans text-[0.8125rem] leading-[1.55] text-[#2A2118] mb-3">
                  Since you're under 18, we need a parent or legal guardian's email confirming they're
                  aware of and okay with you using eengineer, before you can continue.
                </p>
                <input
                  value={guardianEmail}
                  onChange={(e) => setGuardianEmailDraft(e.target.value)}
                  type="email"
                  placeholder="Parent/guardian email"
                  className={cn(inputClass, 'mb-3')}
                />
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={guardianConsentChecked}
                    onChange={(e) => setGuardianConsentChecked(e.target.checked)}
                    className="mt-0.5 w-4 h-4 flex-shrink-0 accent-corn-700"
                  />
                  <span className="font-sans text-[0.8125rem] leading-[1.5] text-[#2A2118]">
                    I confirm my parent or legal guardian is aware of and has given permission for me
                    to create and use this account.
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <LabelCaps theme="welcome" className="block mb-2.5">Name</LabelCaps>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className={inputClass}
            />
          </div>

          {/* Photo */}
          <div>
            <LabelCaps theme="welcome" className="block mb-2.5">Photo</LabelCaps>
            <div className="flex items-center gap-4">
              <Avatar name={name || 'Builder'} src={avatarPreview} theme="welcome" size="lg" />
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
                    <button
                      type="button"
                      onClick={() => removeInterest(i)}
                      aria-label={`Remove ${i}`}
                      className="min-w-[40px] min-h-[40px] -my-2.5 -mr-2 flex items-center justify-center"
                    >
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
          <label className="flex items-center gap-1 cursor-pointer select-none">
            <button
              type="button"
              role="switch"
              aria-checked={openToWork}
              onClick={() => setOpenToWorkDraft((v) => !v)}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center flex-shrink-0"
            >
              <span
                className={cn(
                  'relative w-10 h-[22px] rounded-full transition-colors duration-150',
                  openToWork ? 'bg-corn-700' : 'bg-corn-900/15'
                )}
              >
                <span
                  className={cn(
                    'absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-150',
                    openToWork ? 'translate-x-[18px]' : 'translate-x-0'
                  )}
                />
              </span>
            </button>
            <span className="font-sans text-[0.875rem] text-[#2A2118]">Open to work / internships</span>
          </label>
        </div>

        {!canProceed && (
          <p className="font-sans text-[12px] text-corn-800/80 mt-6">
            {!hasValidBirthdate
              ? 'Enter your date of birth to continue.'
              : "Enter a parent/guardian email and check the box above to continue."}
          </p>
        )}

        <div className="flex items-center gap-3 mt-4">
          <Button
            variant="primary"
            size="lg"
            onClick={finish}
            disabled={!canProceed}
            className="gap-2 font-sans text-[0.8125rem] font-semibold tracking-[0.05em] uppercase"
          >
            Save and continue
            <ArrowRight size={13} strokeWidth={2.5} />
          </Button>
          <Button
            variant="ghost"
            size="lg"
            disabled={!canProceed}
            onClick={() => {
              if (!canProceed) return
              recordAgeGate()
              if (name.trim()) updateName(name.trim())
              navigate('/dashboard')
            }}
            className="font-sans text-[0.8125rem] font-semibold tracking-[0.05em] uppercase"
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  )
}
