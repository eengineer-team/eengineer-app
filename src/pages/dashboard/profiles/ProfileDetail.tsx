import * as React from 'react'
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, Award, Code2, Link as LinkIcon, Users, Check, Briefcase, MessageSquare } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useProfiles } from '@/lib/profiles-context'
import { useMessages } from '@/lib/messages-context'
import { ME_ID, BACKGROUND_PRESETS } from '@/lib/profile-data'
import { Avatar } from '@/components/ui/avatar'
import { Chip } from '@/components/ui/chip'
import { LabelCaps } from '@/components/ui/label-caps'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn, errorMessage } from '@/lib/utils'
import { SkillBar } from '@/components/profile/SkillBar'
import { EndorseDialog } from '@/components/profile/EndorseDialog'
import { useMorphOnChange } from '@/lib/use-morph-on-change'

function displayName(user: ReturnType<typeof useAuth>['user'], name: string) {
  return name === 'You' && user?.status === 'builder' ? user.name : name
}

type EndorseTarget = { type: 'skill' | 'project'; name: string } | null

// Read-only view of another Builder's profile. Editing your own profile
// happens in Settings now (see SettingsPage) — visiting your own id here
// redirects there instead of rendering an edit form on this page.
export function ProfileDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { getProfile, addEndorsement, toggleConnect, loading } = useProfiles()
  const { startConversation } = useMessages()
  const navigate = useNavigate()

  const profile = id ? getProfile(id) : undefined

  const [endorseTarget, setEndorseTarget] = React.useState<EndorseTarget>(null)
  const [messageError, setMessageError] = React.useState<string | null>(null)

  // Brief pop when Connect actually transitions (none → requested →
  // connected) — never on mount, never on unrelated re-renders.
  const connectMorph = useMorphOnChange(profile?.connectStatus)

  // conv_insert requires app.can_message() (connected + both verified +
  // neither blocked + both allow_dms) — only reachable from the
  // "connected, DMs on" branch below, but the RLS denial is still the real
  // boundary, so a failure here surfaces visibly instead of navigating to a
  // dead conversation.
  async function handleMessage() {
    if (!profile) return
    setMessageError(null)
    try {
      await startConversation(profile.id)
      navigate('/dashboard/messages')
    } catch (err) {
      setMessageError(errorMessage(err, "Couldn't start that conversation."))
    }
  }

  // Wait for the first fetch before deciding this id doesn't exist. Without
  // this, opening or refreshing a profile URL directly bounces straight back
  // to the list, because on the first render the store is still empty.
  if (loading) {
    return (
      <div className="flex-1 w-full px-8 py-8 max-w-[720px] mx-auto">
        <p className="font-sans text-[0.8125rem] text-dark-muted">Loading profile…</p>
      </div>
    )
  }
  if (!profile) return <Navigate to="/dashboard/profiles" replace />
  if (profile.id === ME_ID) return <Navigate to="/dashboard/settings" replace />

  const name = displayName(user, profile.name)
  const myName = user?.status === 'builder' ? user.name : 'You'
  const background = BACKGROUND_PRESETS.find((b) => b.id === profile.backgroundId) ?? BACKGROUND_PRESETS[0]

  // Inline closure (not a `function` declaration) so TS carries the `profile`
  // narrowing from the guard above — named function declarations don't get
  // that narrowing since they're hoisted and TS can't prove call order.
  const endorsementCountFor = (type: 'skill' | 'project', targetName: string) => {
    return profile.endorsements.filter((e) => e.targetType === type && e.targetName === targetName).length
  }

  return (
    <div className="flex-1 w-full px-8 py-8 max-w-[720px] mx-auto">
      <Link
        to="/dashboard/profiles"
        className="inline-flex items-center gap-1.5 font-sans text-[0.8125rem] text-dark-muted hover:text-white/85 transition-colors mb-6"
      >
        <ArrowLeft size={13} strokeWidth={2} />
        All profiles
      </Link>

      {/* Header banner */}
      <div
        className={`relative rounded-lg border border-white/8 p-6 mb-6 overflow-hidden ${
          profile.backgroundImageUrl ? '' : background.className
        }`}
        style={
          profile.backgroundImageUrl
            ? { backgroundImage: `url(${profile.backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : undefined
        }
      >
        {profile.backgroundImageUrl && <div className="absolute inset-0 bg-black/55" />}
        <div className="relative flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <Avatar name={name} src={profile.avatarUrl} theme="dashboard" size="lg" />
            {profile.online && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-dark-100" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="font-display text-[1.25rem] font-bold text-dark-text leading-tight">{name}</h1>
              <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 bg-gold-dark/15 border border-gold-dark/30 text-gold-dark font-sans text-[12px] font-semibold uppercase tracking-wide">
                Builder
              </span>
              {profile.openToWork && (
                <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-sans text-[12px] font-semibold uppercase tracking-wide">
                  <Briefcase size={10} strokeWidth={2} />
                  Open to work
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Chip theme="dashboard" discipline={profile.discipline}>{profile.discipline}</Chip>
              <div className="flex items-center gap-1.5 text-dark-muted">
                <Users size={11} strokeWidth={1.8} />
                <span className="font-sans text-[13px]">{profile.mutuals} mutual connections</span>
              </div>
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

          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            {profile.connectStatus === 'connected' ? (
              <>
                {/* Reached achievement, not a blocked action — skip Button's
                    disabled:opacity-40 styling (same pattern as Network.tsx). */}
                <span
                  className={cn(
                    buttonVariants({ variant: 'done', size: 'sm' }),
                    'pointer-events-none',
                    connectMorph && 'animate-pop-in motion-reduce:animate-none'
                  )}
                >
                  <Check size={14} strokeWidth={2.2} />
                  Connected
                </span>
                {/* app.can_message also requires both allow_dms=true — DMs
                    off is shown instead of a Message button that would 403,
                    same rule as ProfilePreviewPopover. */}
                {profile.allowDMs === false ? (
                  <span
                    className="flex items-center gap-1.5 font-sans text-[12px] text-dark-muted/70"
                    title={`${name} has turned off direct messages`}
                  >
                    <MessageSquare size={12} strokeWidth={2} />
                    DMs off
                  </span>
                ) : (
                  <button
                    onClick={() => void handleMessage()}
                    className="flex items-center gap-1.5 font-sans text-[12px] font-medium text-gold-dark hover:brightness-110 transition-all"
                  >
                    <MessageSquare size={12} strokeWidth={2} />
                    Message
                  </button>
                )}
              </>
            ) : (
              // Not connected — messaging is deliberately unreachable here.
              // app.can_message requires app.are_connected(a, b); Connect is
              // the only path to a Message action, never the other way.
              <Button
                variant={profile.connectStatus === 'requested' ? 'shell' : 'accent'}
                size="sm"
                onClick={() => toggleConnect(profile.id)}
                className={cn(connectMorph && 'animate-pop-in motion-reduce:animate-none')}
              >
                {profile.connectStatus === 'requested' ? 'Requested' : 'Connect'}
              </Button>
            )}
            {messageError && (
              <p className="font-sans text-[11px] text-red-400 text-right" role="alert">
                {messageError}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="mb-8">
        <p className="font-sans text-[0.9375rem] leading-[1.6] text-white/80">{profile.bio}</p>
      </div>

      {/* Interests */}
      {profile.interests.length > 0 && (
        <section className="mb-8">
          <LabelCaps className="block mb-3">Interests</LabelCaps>
          <div className="flex flex-wrap gap-1.5">
            {profile.interests.map((i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 bg-white/6 border border-white/10 font-sans text-[0.75rem] text-white/80"
              >
                {i}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      <section className="mb-8">
        <LabelCaps className="block mb-3">Skills</LabelCaps>
        <div className="bg-white/[0.03] border border-white/8 rounded-lg p-4">
          {profile.skills.length === 0 && (
            <p className="font-sans text-[0.8125rem] text-dark-muted">No skills listed yet.</p>
          )}
          {profile.skills.map((skill) => (
            <div key={skill.name} className="relative flex items-center gap-3">
              <div className="flex-1">
                <SkillBar name={skill.name} proficiency={skill.proficiency} editable={false} />
              </div>
              <button
                onClick={() => setEndorseTarget({ type: 'skill', name: skill.name })}
                className="flex items-center gap-1 font-sans text-[13px] text-dark-muted hover:text-gold-dark transition-colors flex-shrink-0"
              >
                <Award size={12} strokeWidth={1.8} />
                Endorse{endorsementCountFor('skill', skill.name) > 0 ? ` (${endorsementCountFor('skill', skill.name)})` : ''}
              </button>
              {endorseTarget?.type === 'skill' && endorseTarget.name === skill.name && (
                <EndorseDialog
                  targetName={skill.name}
                  onClose={() => setEndorseTarget(null)}
                  onSubmit={(reason, evidenceUrl) => {
                    addEndorsement(profile.id, 'skill', skill.name, reason, myName, evidenceUrl)
                    setEndorseTarget(null)
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Projects */}
      <section className="mb-8">
        <LabelCaps className="block mb-3">Projects</LabelCaps>

        {profile.projects.length === 0 ? (
          <p className="font-sans text-[0.8125rem] text-dark-muted">No standalone projects yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {profile.projects.map((project) => (
              <div key={project.id} className="relative bg-white/[0.03] border border-white/8 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <h3 className="font-sans text-[0.9375rem] font-semibold text-dark-text">
                    {project.title}
                    <span className="font-normal text-dark-muted"> · {project.year}</span>
                  </h3>
                  <button
                    onClick={() => setEndorseTarget({ type: 'project', name: project.title })}
                    className="flex items-center gap-1 font-sans text-[13px] text-dark-muted hover:text-gold-dark transition-colors flex-shrink-0"
                  >
                    <Award size={12} strokeWidth={1.8} />
                    Endorse{endorsementCountFor('project', project.title) > 0 ? ` (${endorsementCountFor('project', project.title)})` : ''}
                  </button>
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
                    onSubmit={(reason, evidenceUrl) => {
                      addEndorsement(profile.id, 'project', project.title, reason, myName, evidenceUrl)
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
        <LabelCaps className="block mb-3">Experience</LabelCaps>

        {profile.experience.length === 0 ? (
          <p className="font-sans text-[0.8125rem] text-dark-muted">No experience listed yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {profile.experience.map((exp) => (
              <div key={exp.id} className="bg-white/[0.03] border border-white/8 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h3 className="font-sans text-[0.9375rem] font-semibold text-dark-text">{exp.role}</h3>
                  <span className="font-sans text-[13px] text-dark-muted flex-shrink-0">{exp.duration}</span>
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
                {e.evidenceUrl && (
                  <a
                    href={e.evidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 font-sans text-[12px] text-gold-dark underline underline-offset-2 decoration-current/40 hover:decoration-current"
                  >
                    <LinkIcon size={12} strokeWidth={1.8} />
                    View evidence
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
