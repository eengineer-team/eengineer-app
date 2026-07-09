import * as React from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { ArrowLeft, Plus, Award, Code2, Link as LinkIcon, Users, Check, X, Briefcase } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useProfiles } from '@/lib/profiles-context'
import { ME_ID, BACKGROUND_PRESETS } from '@/lib/profile-data'
import { Avatar } from '@/components/ui/avatar'
import { Chip } from '@/components/ui/chip'
import { LabelCaps } from '@/components/ui/label-caps'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SkillBar } from '@/components/profile/SkillBar'
import { EndorseDialog } from '@/components/profile/EndorseDialog'

function displayName(user: ReturnType<typeof useAuth>['user'], name: string) {
  return name === 'You' && user?.status === 'builder' ? user.name : name
}

type EndorseTarget = { type: 'skill' | 'project'; name: string } | null

export function ProfileDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const {
    getProfile,
    rateSkill,
    addSkill,
    addProject,
    addExperience,
    setBackground,
    setBio,
    setInterests,
    setOpenToWork,
    addEndorsement,
    toggleConnect,
  } = useProfiles()

  const profile = id ? getProfile(id) : undefined

  const [newSkill, setNewSkill] = React.useState('')
  const [bioDraft, setBioDraft] = React.useState('')
  const [editingBio, setEditingBio] = React.useState(false)
  const [showProjectForm, setShowProjectForm] = React.useState(false)
  const [projectTitle, setProjectTitle] = React.useState('')
  const [projectYear, setProjectYear] = React.useState(() => String(new Date().getFullYear()))
  const [projectDesc, setProjectDesc] = React.useState('')
  const [projectSkills, setProjectSkills] = React.useState<string[]>([])
  const [endorseTarget, setEndorseTarget] = React.useState<EndorseTarget>(null)
  const [newInterest, setNewInterest] = React.useState('')
  const [showExpForm, setShowExpForm] = React.useState(false)
  const [expRole, setExpRole] = React.useState('')
  const [expOrg, setExpOrg] = React.useState('')
  const [expDuration, setExpDuration] = React.useState('')
  const [expDesc, setExpDesc] = React.useState('')

  if (!profile) return <Navigate to="/dashboard/profiles" replace />

  const isOwn = profile.id === ME_ID
  const name = displayName(user, profile.name)
  const myName = user?.status === 'builder' ? user.name : 'You'
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

  // Arrow consts (not `function` declarations) so TS carries the `profile`
  // narrowing from the guard above — same reasoning as endorsementCountFor below.
  const addInterestHandler = () => {
    const trimmed = newInterest.trim()
    if (!trimmed || profile.interests.includes(trimmed)) {
      setNewInterest('')
      return
    }
    setInterests([...profile.interests, trimmed])
    setNewInterest('')
  }

  const removeInterestHandler = (name: string) => {
    setInterests(profile.interests.filter((i) => i !== name))
  }

  const submitExperience = () => {
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

  // Inline closure (not a `function` declaration) so TS carries the `profile`
  // narrowing from the guard above — named function declarations don't get
  // that narrowing since they're hoisted and TS can't prove call order.
  const endorsementCountFor = (type: 'skill' | 'project', targetName: string) => {
    return profile.endorsements.filter((e) => e.targetType === type && e.targetName === targetName).length
  }

  return (
    <div className="flex-1 px-8 py-8 max-w-[720px]">
      <Link
        to="/dashboard/profiles"
        className="inline-flex items-center gap-1.5 font-sans text-[0.8125rem] text-white/50 hover:text-white/85 transition-colors mb-6"
      >
        <ArrowLeft size={13} strokeWidth={2} />
        All profiles
      </Link>

      {/* Header banner — customizable background, own profile only */}
      <div className={`relative rounded-lg border border-white/8 p-6 mb-6 ${background.className}`}>
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <Avatar name={name} src={profile.avatarUrl} theme="dashboard" size="lg" />
            {profile.online && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-dark-100" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="font-display text-[1.25rem] font-bold text-dark-text leading-tight">{name}</h1>
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
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Chip theme="dashboard" discipline={profile.discipline}>{profile.discipline}</Chip>
              {!isOwn && (
                <div className="flex items-center gap-1.5 text-dark-muted">
                  <Users size={11} strokeWidth={1.8} />
                  <span className="font-sans text-[11px]">{profile.mutuals} mutual connections</span>
                </div>
              )}
            </div>
            {(profile.githubUrl || profile.linkedinUrl) && (
              <div className="flex items-center gap-3">
                {profile.githubUrl && (
                  <a
                    href={profile.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-sans text-[12px] text-dark-muted hover:text-dark-text transition-colors"
                  >
                    <Code2 size={13} strokeWidth={1.8} />
                    GitHub
                  </a>
                )}
                {profile.linkedinUrl && (
                  <a
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-sans text-[12px] text-dark-muted hover:text-dark-text transition-colors"
                  >
                    <LinkIcon size={13} strokeWidth={1.8} />
                    LinkedIn
                  </a>
                )}
              </div>
            )}
          </div>

          {!isOwn && (
            <div className="flex-shrink-0">
              {profile.connectStatus === 'connected' ? (
                // Reached achievement, not a blocked action — skip Button's
                // disabled:opacity-40 styling (same pattern as Network.tsx).
                <span className={cn(buttonVariants({ variant: 'done', size: 'sm' }), 'pointer-events-none')}>
                  <Check size={14} strokeWidth={2.2} />
                  Connected
                </span>
              ) : (
                <Button
                  variant={profile.connectStatus === 'requested' ? 'shell' : 'accent'}
                  size="sm"
                  onClick={() => toggleConnect(profile.id)}
                >
                  {profile.connectStatus === 'requested' ? 'Requested' : 'Connect'}
                </Button>
              )}
            </div>
          )}
        </div>

        {isOwn && (
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
        )}

        {isOwn && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/8">
            <LabelCaps>Open to work</LabelCaps>
            <button
              role="switch"
              aria-checked={profile.openToWork}
              onClick={() => setOpenToWork(!profile.openToWork)}
              className={`relative w-9 h-5 rounded-full flex-shrink-0 transition-colors duration-150 ${
                profile.openToWork ? 'bg-emerald-500' : 'bg-white/15'
              }`}
            >
              <span
                className={`absolute top-[3px] w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-150 ${
                  profile.openToWork ? 'translate-x-[19px]' : 'translate-x-[3px]'
                }`}
              />
            </button>
          </div>
        )}
      </div>

      {/* Bio */}
      <div className="mb-8">
        {editingBio ? (
          <div>
            <textarea
              value={bioDraft}
              onChange={(e) => setBioDraft(e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2.5 font-sans text-[0.875rem] text-white/90 focus:outline-none focus:border-white/25 resize-none mb-2"
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
            {isOwn && (
              <button
                onClick={() => {
                  setBioDraft(profile.bio)
                  setEditingBio(true)
                }}
                className="flex-shrink-0 font-sans text-[12px] text-white/45 hover:text-white/80 transition-colors"
              >
                Edit
              </button>
            )}
          </div>
        )}
      </div>

      {/* Interests */}
      {(profile.interests.length > 0 || isOwn) && (
        <section className="mb-8">
          <LabelCaps className="block mb-3">Interests</LabelCaps>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {profile.interests.length === 0 && (
              <p className="font-sans text-[0.8125rem] text-white/40">No interests listed yet.</p>
            )}
            {profile.interests.map((i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 bg-white/6 border border-white/10 font-sans text-[0.75rem] text-white/80"
              >
                {i}
                {isOwn && (
                  <button onClick={() => removeInterestHandler(i)} aria-label={`Remove ${i}`}>
                    <X size={11} strokeWidth={2} className="text-white/40 hover:text-white/80" />
                  </button>
                )}
              </span>
            ))}
          </div>
          {isOwn && (
            <div className="flex items-center gap-2">
              <input
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addInterestHandler()
                }}
                placeholder="Add an interest…"
                className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-1.5 font-sans text-[0.8125rem] text-white/90 placeholder:text-white/35 focus:outline-none focus:border-white/25"
              />
              <Button variant="shell" size="sm" onClick={addInterestHandler} disabled={!newInterest.trim()}>
                Add
              </Button>
            </div>
          )}
        </section>
      )}

      {/* Skills */}
      <section className="mb-8">
        <LabelCaps className="block mb-3">{isOwn ? 'My Skills' : 'Skills'}</LabelCaps>
        <div className="bg-white/[0.03] border border-white/8 rounded-lg p-4">
          {profile.skills.length === 0 && (
            <p className="font-sans text-[0.8125rem] text-white/40">No skills listed yet.</p>
          )}
          {profile.skills.map((skill) => (
            <div key={skill.name} className="relative flex items-center gap-3">
              <div className="flex-1">
                <SkillBar
                  name={skill.name}
                  proficiency={skill.proficiency}
                  editable={isOwn}
                  onRate={(level) => rateSkill(skill.name, level)}
                />
              </div>
              {!isOwn && (
                <>
                  <button
                    onClick={() => setEndorseTarget({ type: 'skill', name: skill.name })}
                    className="flex items-center gap-1 font-sans text-[11px] text-white/45 hover:text-gold-dark transition-colors flex-shrink-0"
                  >
                    <Award size={12} strokeWidth={1.8} />
                    Endorse{endorsementCountFor('skill', skill.name) > 0 ? ` (${endorsementCountFor('skill', skill.name)})` : ''}
                  </button>
                  {endorseTarget?.type === 'skill' && endorseTarget.name === skill.name && (
                    <EndorseDialog
                      targetName={skill.name}
                      onClose={() => setEndorseTarget(null)}
                      onSubmit={(reason) => {
                        addEndorsement(profile.id, 'skill', skill.name, reason, myName)
                        setEndorseTarget(null)
                      }}
                    />
                  )}
                </>
              )}
            </div>
          ))}

          {isOwn && (
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
                className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-1.5 font-sans text-[0.8125rem] text-white/90 placeholder:text-white/35 focus:outline-none focus:border-white/25"
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
          )}
        </div>
      </section>

      {/* Projects */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <LabelCaps>Projects</LabelCaps>
          {isOwn && (
            <Button variant="shell" size="sm" onClick={() => setShowProjectForm((v) => !v)}>
              <Plus size={13} strokeWidth={2} />
              Add project
            </Button>
          )}
        </div>

        {isOwn && showProjectForm && (
          <div className="bg-white/[0.03] border border-white/8 rounded-lg p-4 mb-4">
            <div className="flex gap-2 mb-2">
              <input
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Project title"
                className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 font-sans text-[0.8125rem] text-white/90 placeholder:text-white/35 focus:outline-none focus:border-white/25"
              />
              <input
                value={projectYear}
                onChange={(e) => setProjectYear(e.target.value)}
                placeholder="Year"
                inputMode="numeric"
                className="w-20 bg-white/5 border border-white/10 rounded px-3 py-2 font-sans text-[0.8125rem] text-white/90 placeholder:text-white/35 focus:outline-none focus:border-white/25"
              />
            </div>
            <textarea
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              rows={3}
              placeholder="What did you build, and how?"
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 font-sans text-[0.8125rem] text-white/90 placeholder:text-white/35 focus:outline-none focus:border-white/25 resize-none mb-3"
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
                          : 'border-white/10 text-white/55 hover:text-white/85 hover:border-white/20'
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
          <p className="font-sans text-[0.8125rem] text-white/40">No standalone projects yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {profile.projects.map((project) => (
              <div key={project.id} className="relative bg-white/[0.03] border border-white/8 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <h3 className="font-sans text-[0.9375rem] font-semibold text-white/90">
                    {project.title}
                    <span className="font-normal text-white/40"> · {project.year}</span>
                  </h3>
                  {!isOwn && (
                    <button
                      onClick={() => setEndorseTarget({ type: 'project', name: project.title })}
                      className="flex items-center gap-1 font-sans text-[11px] text-white/45 hover:text-gold-dark transition-colors flex-shrink-0"
                    >
                      <Award size={12} strokeWidth={1.8} />
                      Endorse{endorsementCountFor('project', project.title) > 0 ? ` (${endorsementCountFor('project', project.title)})` : ''}
                    </button>
                  )}
                </div>
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
                {endorseTarget?.type === 'project' && endorseTarget.name === project.title && (
                  <EndorseDialog
                    targetName={project.title}
                    onClose={() => setEndorseTarget(null)}
                    onSubmit={(reason) => {
                      addEndorsement(profile.id, 'project', project.title, reason, myName)
                      setEndorseTarget(null)
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Experience */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <LabelCaps>Experience</LabelCaps>
          {isOwn && (
            <Button variant="shell" size="sm" onClick={() => setShowExpForm((v) => !v)}>
              <Plus size={13} strokeWidth={2} />
              Add experience
            </Button>
          )}
        </div>

        {isOwn && showExpForm && (
          <div className="bg-white/[0.03] border border-white/8 rounded-lg p-4 mb-4">
            <div className="flex gap-2 mb-2">
              <input
                value={expRole}
                onChange={(e) => setExpRole(e.target.value)}
                placeholder="Role — e.g. Propulsion Intern"
                className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 font-sans text-[0.8125rem] text-white/90 placeholder:text-white/35 focus:outline-none focus:border-white/25"
              />
              <input
                value={expDuration}
                onChange={(e) => setExpDuration(e.target.value)}
                placeholder="When"
                className="w-28 bg-white/5 border border-white/10 rounded px-3 py-2 font-sans text-[0.8125rem] text-white/90 placeholder:text-white/35 focus:outline-none focus:border-white/25"
              />
            </div>
            <input
              value={expOrg}
              onChange={(e) => setExpOrg(e.target.value)}
              placeholder="Organization"
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 font-sans text-[0.8125rem] text-white/90 placeholder:text-white/35 focus:outline-none focus:border-white/25 mb-2"
            />
            <textarea
              value={expDesc}
              onChange={(e) => setExpDesc(e.target.value)}
              rows={2}
              placeholder="What did you do?"
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 font-sans text-[0.8125rem] text-white/90 placeholder:text-white/35 focus:outline-none focus:border-white/25 resize-none mb-3"
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
          <p className="font-sans text-[0.8125rem] text-white/40">No experience listed yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {profile.experience.map((exp) => (
              <div key={exp.id} className="bg-white/[0.03] border border-white/8 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h3 className="font-sans text-[0.9375rem] font-semibold text-white/90">{exp.role}</h3>
                  <span className="font-sans text-[11px] text-white/40 flex-shrink-0">{exp.duration}</span>
                </div>
                <p className="font-sans text-[12px] text-dark-muted mb-1.5">{exp.organization}</p>
                {exp.description && (
                  <p className="font-sans text-[0.8125rem] leading-[1.55] text-white/60">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Endorsements — the reason is always shown, never hidden from the endorsee */}
      <section>
        <LabelCaps className="block mb-3">Endorsements</LabelCaps>
        {profile.endorsements.length === 0 ? (
          <p className="font-sans text-[0.8125rem] text-white/40">No endorsements yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {profile.endorsements.map((e) => (
              <div key={e.id} className="bg-white/[0.03] border border-white/8 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-sans text-[0.8125rem] font-medium text-white/85">{e.fromName}</span>
                  <span className="font-sans text-[12px] text-white/40">
                    endorsed {e.targetType} · {e.targetName}
                  </span>
                </div>
                <p className="font-sans text-[0.8125rem] leading-snug text-white/65 italic">"{e.reason}"</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
