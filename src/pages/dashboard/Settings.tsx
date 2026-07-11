import * as React from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor, Bell, Mail, Plus, Briefcase, X } from 'lucide-react'
import { useProfiles } from '@/lib/profiles-context'
import { useAuth } from '@/lib/auth-context'
import { ME_ID, BACKGROUND_PRESETS } from '@/lib/profile-data'
import { Avatar } from '@/components/ui/avatar'
import { Chip } from '@/components/ui/chip'
import { LabelCaps } from '@/components/ui/label-caps'
import { Button } from '@/components/ui/button'
import { SkillBar } from '@/components/profile/SkillBar'
import { cn } from '@/lib/utils'

const APPEARANCE_OPTIONS = [
  { id: 'light', label: 'Light', icon: Sun, available: false },
  { id: 'dark', label: 'Dark', icon: Moon, available: true },
  { id: 'system', label: 'System', icon: Monitor, available: false },
] as const

const PREFS_STORAGE_KEY = 'eengineer:notification-prefs'

interface NotificationPrefs {
  emailDigest: boolean
  mentionAlerts: boolean
}

function readStoredPrefs(): NotificationPrefs {
  if (typeof window === 'undefined') return { emailDigest: true, mentionAlerts: true }
  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY)
    if (!raw) return { emailDigest: true, mentionAlerts: true }
    return JSON.parse(raw)
  } catch {
    return { emailDigest: true, mentionAlerts: true }
  }
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="min-w-[40px] min-h-[40px] flex items-center justify-center flex-shrink-0"
    >
      <span
        className={cn(
          'relative w-9 h-5 rounded-full transition-colors duration-150',
          checked ? 'bg-gold-dark' : 'bg-white/15'
        )}
      >
        <span
          className={cn(
            'absolute top-[3px] left-[3px] w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-150',
            checked ? 'translate-x-[16px]' : 'translate-x-0'
          )}
        />
      </span>
    </button>
  )
}

// Step: profile editing lives here now, not on the Profiles page. Profiles
// is a public browse-other-Builders surface (see ProfilesList.tsx /
// ProfileDetail.tsx); "making your own account" — bio, skills, projects,
// experience, background, open-to-work — belongs with the rest of your
// account preferences instead. ProfilesList's own card and a direct visit to
// /dashboard/profiles/{ME_ID} both redirect here (see ProfileDetail.tsx).
export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [prefs, setPrefs] = React.useState<NotificationPrefs>(readStoredPrefs)

  const {
    getProfile,
    rateSkill,
    addSkill,
    addProject,
    addExperience,
    setBackground,
    setName,
    setBio,
    setInterests,
    setOpenToWork,
  } = useProfiles()
  const { updateName } = useAuth()

  const profile = getProfile(ME_ID)

  const [newSkill, setNewSkill] = React.useState('')
  const [nameDraft, setNameDraft] = React.useState('')
  const [editingName, setEditingName] = React.useState(false)
  const [bioDraft, setBioDraft] = React.useState('')
  const [editingBio, setEditingBio] = React.useState(false)
  const [showProjectForm, setShowProjectForm] = React.useState(false)
  const [projectTitle, setProjectTitle] = React.useState('')
  const [projectYear, setProjectYear] = React.useState(() => String(new Date().getFullYear()))
  const [projectDesc, setProjectDesc] = React.useState('')
  const [projectSkills, setProjectSkills] = React.useState<string[]>([])
  const [newInterest, setNewInterest] = React.useState('')
  const [showExpForm, setShowExpForm] = React.useState(false)
  const [expRole, setExpRole] = React.useState('')
  const [expOrg, setExpOrg] = React.useState('')
  const [expDuration, setExpDuration] = React.useState('')
  const [expDesc, setExpDesc] = React.useState('')

  React.useEffect(() => {
    window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs))
  }, [prefs])

  React.useEffect(() => {
    if (theme !== 'dark') setTheme('dark')
  }, [theme, setTheme])

  if (!profile) {
    return (
      <div className="flex-1 px-8 py-8 max-w-[720px]">
        <p className="font-sans text-[0.8125rem] text-dark-muted">Couldn't load your profile.</p>
      </div>
    )
  }

  const background = BACKGROUND_PRESETS.find((b) => b.id === profile.backgroundId) ?? BACKGROUND_PRESETS[0]

  function toggleProjectSkill(skillName: string) {
    setProjectSkills((prev) => (prev.includes(skillName) ? prev.filter((s) => s !== skillName) : [...prev, skillName]))
  }

  function submitProject() {
    const title = projectTitle.trim()
    const description = projectDesc.trim()
    const year = parseInt(projectYear, 10)
    if (!title || !description || !year) return
    addProject({ title, year, description, skillNames: projectSkills })
    setProjectTitle('')
    setProjectYear(String(new Date().getFullYear()))
    setProjectDesc('')
    setProjectSkills([])
    setShowProjectForm(false)
  }

  function addInterestHandler() {
    const trimmed = newInterest.trim()
    if (!trimmed || profile!.interests.includes(trimmed)) {
      setNewInterest('')
      return
    }
    setInterests([...profile!.interests, trimmed])
    setNewInterest('')
  }

  function removeInterestHandler(name: string) {
    setInterests(profile!.interests.filter((i) => i !== name))
  }

  function submitExperience() {
    const role = expRole.trim()
    if (!role) return
    addExperience({
      role,
      organization: expOrg.trim() || 'Independent',
      duration: expDuration.trim() || 'Present',
      description: expDesc.trim(),
    })
    setExpRole('')
    setExpOrg('')
    setExpDuration('')
    setExpDesc('')
    setShowExpForm(false)
  }

  return (
    <div className="flex-1 px-8 py-8 max-w-[720px]">
      <h1 className="font-display text-xl font-semibold text-dark-text mb-1">Settings</h1>
      <p className="font-sans text-[0.8125rem] text-dark-muted mb-8">
        Your profile, appearance, and notification preferences.
      </p>

      {/* Your Profile */}
      <section className="mb-10">
        <LabelCaps className="block mb-3">Your Profile</LabelCaps>

        <div className={`relative rounded-lg border border-white/8 p-6 mb-6 ${background.className}`}>
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <Avatar name={profile.name} src={profile.avatarUrl} theme="dashboard" size="lg" />
              {profile.online && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-dark-100" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              {editingName ? (
                <div className="mb-2">
                  <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const trimmed = nameDraft.trim()
                        if (trimmed) {
                          setName(trimmed)
                          updateName(trimmed)
                        }
                        setEditingName(false)
                      }
                    }}
                    autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-1.5 font-display text-[1.0625rem] font-bold text-dark-text focus:outline-none focus:border-white/25 mb-2"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="accent"
                      size="sm"
                      onClick={() => {
                        const trimmed = nameDraft.trim()
                        if (trimmed) {
                          setName(trimmed)
                          updateName(trimmed)
                        }
                        setEditingName(false)
                      }}
                      disabled={!nameDraft.trim()}
                    >
                      Save
                    </Button>
                    <Button variant="shell" size="sm" onClick={() => setEditingName(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h2 className="font-display text-[1.125rem] font-bold text-dark-text leading-tight">{profile.name}</h2>
                  <button
                    onClick={() => {
                      setNameDraft(profile.name)
                      setEditingName(true)
                    }}
                    className="font-sans text-[12px] text-dark-muted hover:text-white/80 transition-colors"
                  >
                    Edit
                  </button>
                  <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 bg-gold-dark/15 border border-gold-dark/30 text-gold-dark font-sans text-[10px] font-semibold uppercase tracking-wide">
                    Builder
                  </span>
                  {profile.openToWork && (
                    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-sans text-[10px] font-semibold uppercase tracking-wide">
                      <Briefcase size={10} strokeWidth={2} />
                      Open to work
                    </span>
                  )}
                </div>
              )}
              <Chip theme="dashboard" discipline={profile.discipline}>{profile.discipline}</Chip>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-white/8">
            <LabelCaps>Background</LabelCaps>
            <div className="flex items-center gap-1.5">
              {BACKGROUND_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setBackground(preset.id)}
                  aria-label={preset.label}
                  title={preset.label}
                  className={`w-6 h-6 rounded-full border transition-all duration-150 ${preset.className} ${
                    profile.backgroundId === preset.id ? 'border-white/70 scale-110' : 'border-white/15'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/8">
            <LabelCaps>Open to work</LabelCaps>
            <Toggle checked={profile.openToWork} onChange={setOpenToWork} />
          </div>
        </div>

        {/* Bio */}
        <div className="mb-6">
          <LabelCaps className="block mb-2">Bio</LabelCaps>
          {editingBio ? (
            <div>
              <textarea
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value)}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2.5 font-sans text-[0.875rem] text-dark-text focus:outline-none focus:border-white/25 resize-none mb-2"
              />
              <div className="flex gap-2">
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => {
                    setBio(bioDraft.trim())
                    setEditingBio(false)
                  }}
                >
                  Save
                </Button>
                <Button variant="shell" size="sm" onClick={() => setEditingBio(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <p className="font-sans text-[0.9375rem] leading-[1.6] text-white/80">{profile.bio}</p>
              <button
                onClick={() => {
                  setBioDraft(profile.bio)
                  setEditingBio(true)
                }}
                className="flex-shrink-0 font-sans text-[12px] text-dark-muted hover:text-white/80 transition-colors"
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Interests */}
        <div className="mb-6">
          <LabelCaps className="block mb-3">Interests</LabelCaps>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {profile.interests.length === 0 && (
              <p className="font-sans text-[0.8125rem] text-dark-muted">No interests listed yet.</p>
            )}
            {profile.interests.map((i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 bg-white/6 border border-white/10 font-sans text-[0.75rem] text-white/80"
              >
                {i}
                <button
                  onClick={() => removeInterestHandler(i)}
                  aria-label={`Remove ${i}`}
                  className="min-w-[40px] min-h-[40px] -my-2.5 -mr-2 flex items-center justify-center"
                >
                  <X size={11} strokeWidth={2} className="text-dark-muted hover:text-white/80" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addInterestHandler()
              }}
              placeholder="Add an interest…"
              className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-1.5 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25"
            />
            <Button variant="shell" size="sm" onClick={addInterestHandler} disabled={!newInterest.trim()}>
              Add
            </Button>
          </div>
        </div>

        {/* Skills */}
        <div className="mb-6">
          <LabelCaps className="block mb-3">Skills</LabelCaps>
          <div className="bg-white/[0.03] border border-white/8 rounded-lg p-4">
            {profile.skills.length === 0 && (
              <p className="font-sans text-[0.8125rem] text-dark-muted">No skills listed yet.</p>
            )}
            {profile.skills.map((skill) => (
              <div key={skill.name} className="flex-1">
                <SkillBar
                  name={skill.name}
                  proficiency={skill.proficiency}
                  editable
                  onRate={(level) => rateSkill(skill.name, level)}
                />
              </div>
            ))}

            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/8">
              <input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addSkill(newSkill)
                    setNewSkill('')
                  }
                }}
                placeholder="Add a skill…"
                className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-1.5 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25"
              />
              <Button
                variant="shell"
                size="sm"
                onClick={() => {
                  addSkill(newSkill)
                  setNewSkill('')
                }}
                disabled={!newSkill.trim()}
              >
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Projects */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <LabelCaps>Projects</LabelCaps>
            <Button variant="shell" size="sm" onClick={() => setShowProjectForm((v) => !v)}>
              <Plus size={13} strokeWidth={2} />
              Add project
            </Button>
          </div>

          {showProjectForm && (
            <div className="bg-white/[0.03] border border-white/8 rounded-lg p-4 mb-4">
              <div className="flex gap-2 mb-2">
                <input
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="Project title"
                  className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25"
                />
                <input
                  value={projectYear}
                  onChange={(e) => setProjectYear(e.target.value)}
                  placeholder="Year"
                  inputMode="numeric"
                  className="w-20 bg-white/5 border border-white/10 rounded px-3 py-2 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25"
                />
              </div>
              <textarea
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                rows={3}
                placeholder="What did you build, and how?"
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25 resize-none mb-3"
              />
              {profile.skills.length > 0 && (
                <div className="mb-3">
                  <LabelCaps className="block mb-2">Skills this proves</LabelCaps>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((s) => (
                      <button
                        key={s.name}
                        onClick={() => toggleProjectSkill(s.name)}
                        className={`font-sans text-[11px] rounded-sm px-2.5 py-1 border transition-colors duration-150 ${
                          projectSkills.includes(s.name)
                            ? 'bg-gold-dark/15 border-gold-dark/40 text-gold-dark'
                            : 'border-white/10 text-dark-muted hover:text-white/85 hover:border-white/20'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="accent"
                  size="sm"
                  onClick={submitProject}
                  disabled={!projectTitle.trim() || !projectDesc.trim() || !projectYear.trim()}
                >
                  Save project
                </Button>
                <Button variant="shell" size="sm" onClick={() => setShowProjectForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {profile.projects.length === 0 ? (
            <p className="font-sans text-[0.8125rem] text-dark-muted">No standalone projects yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {profile.projects.map((project) => (
                <div key={project.id} className="bg-white/[0.03] border border-white/8 rounded-lg p-4">
                  <h3 className="font-sans text-[0.9375rem] font-semibold text-dark-text mb-1.5">
                    {project.title}
                    <span className="font-normal text-dark-muted"> · {project.year}</span>
                  </h3>
                  <p className="font-sans text-[0.8125rem] leading-[1.55] text-white/60 mb-3">{project.description}</p>
                  {project.skillNames.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {project.skillNames.map((s) => (
                        <Chip key={s} theme="dashboard">
                          {s}
                        </Chip>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Experience */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <LabelCaps>Experience</LabelCaps>
            <Button variant="shell" size="sm" onClick={() => setShowExpForm((v) => !v)}>
              <Plus size={13} strokeWidth={2} />
              Add experience
            </Button>
          </div>

          {showExpForm && (
            <div className="bg-white/[0.03] border border-white/8 rounded-lg p-4 mb-4">
              <div className="flex gap-2 mb-2">
                <input
                  value={expRole}
                  onChange={(e) => setExpRole(e.target.value)}
                  placeholder="Role — e.g. Propulsion Intern"
                  className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25"
                />
                <input
                  value={expDuration}
                  onChange={(e) => setExpDuration(e.target.value)}
                  placeholder="When"
                  className="w-28 bg-white/5 border border-white/10 rounded px-3 py-2 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25"
                />
              </div>
              <input
                value={expOrg}
                onChange={(e) => setExpOrg(e.target.value)}
                placeholder="Organization"
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25 mb-2"
              />
              <textarea
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
                rows={2}
                placeholder="What did you do?"
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25 resize-none mb-3"
              />
              <div className="flex gap-2">
                <Button variant="accent" size="sm" onClick={submitExperience} disabled={!expRole.trim()}>
                  Save
                </Button>
                <Button variant="shell" size="sm" onClick={() => setShowExpForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {profile.experience.length === 0 ? (
            <p className="font-sans text-[0.8125rem] text-dark-muted">No experience listed yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {profile.experience.map((exp) => (
                <div key={exp.id} className="bg-white/[0.03] border border-white/8 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className="font-sans text-[0.9375rem] font-semibold text-dark-text">{exp.role}</h3>
                    <span className="font-sans text-[11px] text-dark-muted flex-shrink-0">{exp.duration}</span>
                  </div>
                  <p className="font-sans text-[12px] text-dark-muted mb-1.5">{exp.organization}</p>
                  {exp.description && (
                    <p className="font-sans text-[0.8125rem] leading-[1.55] text-white/60">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Endorsements — received from others, read-only here; the reason is
            always shown, never hidden from the endorsee. */}
        <div>
          <LabelCaps className="block mb-3">Endorsements you've received</LabelCaps>
          {profile.endorsements.length === 0 ? (
            <p className="font-sans text-[0.8125rem] text-dark-muted">No endorsements yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {profile.endorsements.map((e) => (
                <div key={e.id} className="bg-white/[0.03] border border-white/8 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-sans text-[0.8125rem] font-medium text-white/85">{e.fromName}</span>
                    <span className="font-sans text-[12px] text-dark-muted">
                      endorsed {e.targetType} · {e.targetName}
                    </span>
                  </div>
                  <p className="font-sans text-[0.8125rem] leading-snug text-white/65 italic">"{e.reason}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mb-8">
        <LabelCaps className="block mb-3">Appearance</LabelCaps>
        <div className="bg-white/[0.03] border border-white/8 rounded-lg p-4">
          <div className="flex items-center gap-2">
            {APPEARANCE_OPTIONS.map((opt) => {
              const Icon = opt.icon
              const active = theme === opt.id
              return (
                <button
                  key={opt.id}
                  disabled={!opt.available}
                  onClick={() => opt.available && setTheme(opt.id)}
                  aria-disabled={!opt.available}
                  className={cn(
                    'relative flex-1 flex flex-col items-center gap-1.5 py-3 rounded border font-sans text-[0.75rem] font-medium transition-colors duration-150',
                    !opt.available
                      ? 'border-white/5 text-dark-muted/40 cursor-not-allowed'
                      : active
                      ? 'border-gold-dark/50 bg-gold-dark/10 text-gold-dark'
                      : 'border-white/10 text-dark-muted hover:text-white/85 hover:border-white/20'
                  )}
                >
                  <Icon size={16} strokeWidth={1.8} />
                  {opt.label}
                  {!opt.available && (
                    <span className="absolute top-1.5 right-1.5 font-sans text-[9px] font-semibold tracking-wide uppercase text-dark-muted/60">
                      Soon
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <p className="font-sans text-[11px] text-dark-muted leading-snug mt-3">
            Dark only for now — the dashboard hasn't gotten a light-mode pass yet, so Light and
            System are disabled here rather than pretending to switch.
          </p>
        </div>
      </section>

      <section>
        <LabelCaps className="block mb-3">Notifications</LabelCaps>
        <div className="bg-white/[0.03] border border-white/8 rounded-lg divide-y divide-white/8">
          <div className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <Mail size={16} strokeWidth={1.8} className="text-dark-muted flex-shrink-0" />
              <div>
                <div className="font-sans text-[0.8125rem] font-medium text-dark-text">Email digest</div>
                <div className="font-sans text-[11px] text-dark-muted">
                  Weekly summary of activity in your joined communities.
                </div>
              </div>
            </div>
            <Toggle
              checked={prefs.emailDigest}
              onChange={(v) => setPrefs((p) => ({ ...p, emailDigest: v }))}
            />
          </div>
          <div className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <Bell size={16} strokeWidth={1.8} className="text-dark-muted flex-shrink-0" />
              <div>
                <div className="font-sans text-[0.8125rem] font-medium text-dark-text">Mention alerts</div>
                <div className="font-sans text-[11px] text-dark-muted">
                  Notify me when someone replies to my questions or messages me.
                </div>
              </div>
            </div>
            <Toggle
              checked={prefs.mentionAlerts}
              onChange={(v) => setPrefs((p) => ({ ...p, mentionAlerts: v }))}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
