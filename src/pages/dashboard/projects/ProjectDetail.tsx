import * as React from 'react'
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, X, Check, Users, Camera, Link as LinkIcon,
  MessageSquareText, UserPlus, Trash2,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useProfiles } from '@/lib/profiles-context'
import { ME_ID } from '@/lib/profile-data'
import { useProjects } from '@/lib/projects-context'
import { PROJECT_KIND_LABEL, PROJECT_KIND_STAT_HINT, type ProjectKind } from '@/lib/projects-data'
import { Avatar } from '@/components/ui/avatar'
import { Chip } from '@/components/ui/chip'
import { LabelCaps } from '@/components/ui/label-caps'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { cn } from '@/lib/utils'
import { ProjectFeedbackDialog } from '@/components/projects/ProjectFeedbackDialog'

const PROJECT_KINDS: ProjectKind[] = ['telegram', 'website', 'other']

function readAsDataUrl(file: File, onDone: (dataUrl: string) => void) {
  const reader = new FileReader()
  reader.onload = () => onDone(reader.result as string)
  reader.readAsDataURL(file)
}

// One component handles both "My Project" (isOwn: editable) and "Peer
// project" (read-only + feedback/join/follow) — same isOwn-branching
// pattern as ProfileDetail.tsx, rather than two separate page components
// that'd duplicate the whole layout.
export function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { getProfile } = useProfiles()
  const {
    getProject,
    setName,
    setDescription,
    setThumbnail,
    setCover,
    setLink,
    setKind,
    setTelegramUrl,
    setInstagramUrl,
    addStat,
    removeStat,
    addSupportingMaterial,
    removeSupportingMaterial,
    setOpenToRecruitment,
    addTeamMember,
    removeTeamMember,
    toggleJoinRequest,
    toggleFollow,
    addFeedback,
    deleteProject,
  } = useProjects()
  const navigate = useNavigate()

  const project = id ? getProject(id) : undefined

  const [editingInfo, setEditingInfo] = React.useState(false)
  const [nameDraft, setNameDraft] = React.useState('')
  const [descDraft, setDescDraft] = React.useState('')
  const [linkDraft, setLinkDraft] = React.useState('')
  const [telegramDraft, setTelegramDraft] = React.useState('')
  const [instagramDraft, setInstagramDraft] = React.useState('')

  const [showStatForm, setShowStatForm] = React.useState(false)
  const [statLabel, setStatLabel] = React.useState('')
  const [statValue, setStatValue] = React.useState('')

  const [showMaterialForm, setShowMaterialForm] = React.useState(false)
  const [materialLabel, setMaterialLabel] = React.useState('')
  const [materialUrl, setMaterialUrl] = React.useState('')

  const [showTeamForm, setShowTeamForm] = React.useState(false)
  const [teamName, setTeamName] = React.useState('')
  const [teamRole, setTeamRole] = React.useState('')

  const [showFeedback, setShowFeedback] = React.useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  const thumbInputRef = React.useRef<HTMLInputElement>(null)
  const coverInputRef = React.useRef<HTMLInputElement>(null)

  if (!project) return <Navigate to="/dashboard/projects" replace />

  const isOwn = project.ownerId === ME_ID
  const owner = getProfile(project.ownerId)
  const myName = user?.status === 'builder' ? user.name : 'You'
  const isFollowing = project.followerIds.includes(ME_ID)
  const hasRequestedToJoin = project.joinRequests.includes(myName)

  function startEditInfo() {
    if (!project) return
    setNameDraft(project.name)
    setDescDraft(project.description)
    setLinkDraft(project.link ?? '')
    setTelegramDraft(project.telegramUrl ?? '')
    setInstagramDraft(project.instagramUrl ?? '')
    setEditingInfo(true)
  }

  function saveInfo() {
    setName(nameDraft.trim())
    setDescription(descDraft.trim())
    setLink(linkDraft.trim())
    setTelegramUrl(telegramDraft.trim())
    setInstagramUrl(instagramDraft.trim())
    setEditingInfo(false)
  }

  function submitStat() {
    if (!statLabel.trim() || !statValue.trim()) return
    addStat(statLabel, statValue)
    setStatLabel('')
    setStatValue('')
    setShowStatForm(false)
  }

  function submitMaterial() {
    if (!materialLabel.trim() || !materialUrl.trim()) return
    addSupportingMaterial(materialLabel, materialUrl)
    setMaterialLabel('')
    setMaterialUrl('')
    setShowMaterialForm(false)
  }

  function submitTeamMember() {
    if (!teamName.trim()) return
    addTeamMember(teamName, teamRole)
    setTeamName('')
    setTeamRole('')
    setShowTeamForm(false)
  }

  function handleDeleteProject() {
    if (deleting || !project) return
    setDeleting(true)
    setDeleteError(null)
    deleteProject(project.id)
      .then(() => navigate('/dashboard/projects'))
      .catch((err) => {
        setDeleting(false)
        setShowDeleteConfirm(false)
        setDeleteError(err instanceof Error ? `Couldn't delete: ${err.message}` : "Couldn't delete this project.")
      })
  }

  const hasName = !!project.name.trim()
  const deleteWarningParts = [
    project.team.length > 0 && `${project.team.length} team member${project.team.length === 1 ? '' : 's'}`,
    project.supportingMaterials.length > 0 && `${project.supportingMaterials.length} supporting material${project.supportingMaterials.length === 1 ? '' : 's'}`,
    project.feedback.length > 0 && `${project.feedback.length} piece${project.feedback.length === 1 ? '' : 's'} of feedback`,
  ].filter(Boolean) as string[]
  const deleteDescription =
    deleteWarningParts.length > 0
      ? `This permanently deletes "${project.name || 'this project'}" and everything on it — including ${deleteWarningParts.join(', ')}. This cannot be undone.`
      : `This permanently deletes "${project.name || 'this project'}". This cannot be undone.`

  return (
    <div className="flex-1 w-full px-4 md:px-8 py-6 md:py-8 max-w-[720px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/dashboard/projects"
          className="inline-flex items-center gap-1.5 font-sans text-[0.8125rem] text-dark-muted hover:text-white/85 transition-colors"
        >
          <ArrowLeft size={13} strokeWidth={2} />
          All projects
        </Link>
        {isOwn && (
          <div className="relative">
            <button
              onClick={() => setShowDeleteConfirm((v) => !v)}
              aria-label="Delete project"
              className="flex items-center gap-1.5 font-sans text-[12px] text-dark-muted hover:text-red-400 transition-colors"
            >
              <Trash2 size={12} strokeWidth={1.8} />
              Delete project
            </button>
            {showDeleteConfirm && (
              <ConfirmDialog
                title="Delete this project?"
                description={deleteDescription}
                confirmLabel={deleting ? 'Deleting…' : 'Delete project'}
                onConfirm={handleDeleteProject}
                onClose={() => setShowDeleteConfirm(false)}
              />
            )}
          </div>
        )}
      </div>
      {deleteError && (
        <p className="font-sans text-[0.8125rem] text-red-400 mb-4" role="alert">
          {deleteError}
        </p>
      )}

      {/* Cover + thumbnail header */}
      <div className="rounded-lg border border-white/8 overflow-hidden mb-6">
        <div
          className="relative h-28 md:h-36 bg-gradient-to-br from-white/8 to-transparent bg-cover bg-center"
          style={project.coverUrl ? { backgroundImage: `url(${project.coverUrl})` } : undefined}
        >
          {isOwn && (
            <>
              <button
                onClick={() => coverInputRef.current?.click()}
                className="absolute top-3 right-3 flex items-center gap-1.5 bg-dark-900/70 backdrop-blur-sm px-2.5 py-1.5 rounded font-sans text-[13px] text-dark-text hover:bg-dark-900/90 transition-colors"
              >
                <Camera size={12} strokeWidth={1.8} />
                {project.coverUrl ? 'Change cover' : 'Add cover'}
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (file) readAsDataUrl(file, setCover)
                }}
              />
            </>
          )}
        </div>

        <div className="bg-white/[0.02] p-5 pt-0">
          <div className="flex items-end gap-4 -mt-8 mb-4">
            <div className="relative flex-shrink-0">
              <Avatar
                name={project.name || 'New project'}
                src={project.thumbnailUrl}
                theme="dashboard"
                size="lg"
                className="border-4 border-dark-100"
              />
              {isOwn && (
                <>
                  <button
                    onClick={() => thumbInputRef.current?.click()}
                    aria-label="Change project picture"
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-dark-100 border border-white/15 flex items-center justify-center text-dark-muted hover:text-white transition-colors"
                  >
                    <Camera size={11} strokeWidth={2} />
                  </button>
                  <input
                    ref={thumbInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      e.target.value = ''
                      if (file) readAsDataUrl(file, setThumbnail)
                    }}
                  />
                </>
              )}
            </div>

            {!isOwn && (
              <div className="flex-1 flex items-center justify-end gap-2 pb-1">
                <Button
                  variant={isFollowing ? 'done' : 'shell'}
                  size="sm"
                  onClick={() => toggleFollow(project.id)}
                >
                  {isFollowing ? <Check size={13} strokeWidth={2.2} /> : <Users size={13} strokeWidth={1.8} />}
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
                <div className="relative">
                  <Button variant="accent" size="sm" onClick={() => setShowFeedback((v) => !v)}>
                    <MessageSquareText size={13} strokeWidth={1.8} />
                    Give feedback
                  </Button>
                  {showFeedback && (
                    <ProjectFeedbackDialog
                      projectName={project.name}
                      onClose={() => setShowFeedback(false)}
                      onSubmit={(text) => {
                        addFeedback(project.id, myName, text)
                        setShowFeedback(false)
                      }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Name / description / link / socials */}
          {isOwn && editingInfo ? (
            <div className="flex flex-col gap-2.5 mb-2">
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="Project name"
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 font-sans text-[0.9375rem] font-semibold text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25"
              />
              <textarea
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                rows={3}
                placeholder="What is it, and what are you looking for?"
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25 resize-none"
              />
              <input
                value={linkDraft}
                onChange={(e) => setLinkDraft(e.target.value)}
                placeholder="Link — channel URL, website URL, etc."
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25"
              />
              <div className="flex gap-2">
                <input
                  value={telegramDraft}
                  onChange={(e) => setTelegramDraft(e.target.value)}
                  placeholder="Telegram (optional)"
                  className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25"
                />
                <input
                  value={instagramDraft}
                  onChange={(e) => setInstagramDraft(e.target.value)}
                  placeholder="Instagram (optional)"
                  className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="accent" size="sm" onClick={saveInfo} disabled={!nameDraft.trim()}>
                  Save
                </Button>
                <Button variant="shell" size="sm" onClick={() => setEditingInfo(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <h1 className="font-display text-[1.25rem] font-bold text-dark-text leading-tight">
                  {hasName ? project.name : isOwn ? 'Name your project' : 'Untitled project'}
                </h1>
                {isOwn && (
                  <button
                    onClick={startEditInfo}
                    className="flex-shrink-0 font-sans text-[12px] text-dark-muted hover:text-white/80 transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>

              {!isOwn && owner && (
                <div className="flex items-center gap-2 flex-wrap mb-2.5">
                  <Chip theme="dashboard" discipline={owner.discipline}>{owner.discipline}</Chip>
                  <Link
                    to={`/dashboard/profiles/${owner.id}`}
                    className="font-sans text-[12px] text-dark-muted hover:text-dark-text transition-colors"
                  >
                    by {owner.name}
                  </Link>
                </div>
              )}

              <p className="font-sans text-[0.9375rem] leading-[1.6] text-white/80 mb-2.5">
                {project.description || (isOwn ? 'Add a description so other Builders know what you’re building.' : 'No description yet.')}
              </p>

              <div className="flex items-center gap-4 flex-wrap">
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-sans text-[12px] text-dark-muted hover:text-dark-text transition-colors"
                  >
                    <LinkIcon size={12} strokeWidth={1.8} />
                    {project.link.replace(/^https?:\/\//, '')}
                  </a>
                )}
                {project.telegramUrl && (
                  <a href={project.telegramUrl} target="_blank" rel="noreferrer" className="font-sans text-[12px] text-dark-muted hover:text-dark-text transition-colors">
                    Telegram
                  </a>
                )}
                {project.instagramUrl && (
                  <a href={project.instagramUrl} target="_blank" rel="noreferrer" className="font-sans text-[12px] text-dark-muted hover:text-dark-text transition-colors">
                    Instagram
                  </a>
                )}
                <div className="flex items-center gap-1.5 text-dark-muted">
                  <Users size={12} strokeWidth={1.8} />
                  <span className="font-sans text-[12px]">{project.followerIds.length} following</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Project type + stats */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <LabelCaps>Stats</LabelCaps>
          {isOwn && (
            <Button variant="shell" size="sm" onClick={() => setShowStatForm((v) => !v)}>
              <Plus size={13} strokeWidth={2} />
              Add stat
            </Button>
          )}
        </div>

        {isOwn && (
          <div className="flex items-center gap-1.5 mb-3">
            {PROJECT_KINDS.map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={cn(
                  'font-sans text-[13px] rounded-sm px-2.5 py-1 border transition-colors duration-150',
                  project.kind === k
                    ? 'bg-gold-dark/15 border-gold-dark/40 text-gold-dark'
                    : 'border-white/10 text-dark-muted hover:text-white/85 hover:border-white/20'
                )}
              >
                {PROJECT_KIND_LABEL[k]}
              </button>
            ))}
          </div>
        )}

        {isOwn && showStatForm && (
          <div className="bg-white/[0.03] border border-white/8 rounded-lg p-4 mb-3">
            <p className="font-sans text-[13px] text-dark-muted mb-2">{PROJECT_KIND_STAT_HINT[project.kind]}</p>
            <div className="flex gap-2 mb-3">
              <input
                value={statLabel}
                onChange={(e) => setStatLabel(e.target.value)}
                placeholder="Label — e.g. Subscribers"
                className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25"
              />
              <input
                value={statValue}
                onChange={(e) => setStatValue(e.target.value)}
                placeholder="Value — e.g. 1.2k"
                className="w-28 bg-white/5 border border-white/10 rounded px-3 py-2 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="accent" size="sm" onClick={submitStat} disabled={!statLabel.trim() || !statValue.trim()}>
                Save
              </Button>
              <Button variant="shell" size="sm" onClick={() => setShowStatForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {project.stats.length === 0 ? (
          <p className="font-sans text-[0.8125rem] text-dark-muted">No stats added yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {project.stats.map((stat) => (
              <div key={stat.id} className="relative bg-white/[0.03] border border-white/8 rounded-lg p-3">
                {isOwn && (
                  <button
                    onClick={() => removeStat(stat.id)}
                    aria-label={`Remove ${stat.label}`}
                    className="absolute top-2 right-2 text-dark-muted hover:text-white/80"
                  >
                    <X size={11} strokeWidth={2} />
                  </button>
                )}
                <div className="font-sans text-[1.0625rem] font-bold text-dark-text leading-none mb-1">{stat.value}</div>
                <div className="font-sans text-[13px] text-dark-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Supporting materials */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <LabelCaps>Supporting materials</LabelCaps>
          {isOwn && (
            <Button variant="shell" size="sm" onClick={() => setShowMaterialForm((v) => !v)}>
              <Plus size={13} strokeWidth={2} />
              Add link
            </Button>
          )}
        </div>

        {isOwn && showMaterialForm && (
          <div className="bg-white/[0.03] border border-white/8 rounded-lg p-4 mb-3">
            <div className="flex gap-2 mb-3">
              <input
                value={materialLabel}
                onChange={(e) => setMaterialLabel(e.target.value)}
                placeholder="Label — e.g. PRD"
                className="w-32 bg-white/5 border border-white/10 rounded px-3 py-2 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25"
              />
              <input
                value={materialUrl}
                onChange={(e) => setMaterialUrl(e.target.value)}
                placeholder="https://docs.google.com/..."
                className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="accent" size="sm" onClick={submitMaterial} disabled={!materialLabel.trim() || !materialUrl.trim()}>
                Save
              </Button>
              <Button variant="shell" size="sm" onClick={() => setShowMaterialForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {project.supportingMaterials.length === 0 ? (
          <p className="font-sans text-[0.8125rem] text-dark-muted">No supporting materials yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {project.supportingMaterials.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-2 bg-white/[0.03] border border-white/8 rounded-lg px-3.5 py-2.5">
                <a
                  href={m.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 min-w-0 font-sans text-[0.8125rem] text-dark-text hover:text-gold-dark transition-colors"
                >
                  <LinkIcon size={12} strokeWidth={1.8} className="flex-shrink-0" />
                  <span className="truncate">{m.label}</span>
                </a>
                {isOwn && (
                  <button
                    onClick={() => removeSupportingMaterial(m.id)}
                    aria-label={`Remove ${m.label}`}
                    className="flex-shrink-0 text-dark-muted hover:text-white/80"
                  >
                    <X size={12} strokeWidth={2} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Team + recruitment */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <LabelCaps>Team</LabelCaps>
          {isOwn && (
            <Button variant="shell" size="sm" onClick={() => setShowTeamForm((v) => !v)}>
              <Plus size={13} strokeWidth={2} />
              Add member
            </Button>
          )}
        </div>

        {isOwn && (
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/8">
            <LabelCaps>Open to team recruitment</LabelCaps>
            <button
              role="switch"
              aria-checked={project.openToRecruitment}
              onClick={() => setOpenToRecruitment(!project.openToRecruitment)}
              className={`relative w-9 h-5 rounded-full flex-shrink-0 transition-colors duration-150 ${
                project.openToRecruitment ? 'bg-emerald-500' : 'bg-white/15'
              }`}
            >
              <span
                className={`absolute top-[3px] left-[3px] w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-150 ${
                  project.openToRecruitment ? 'translate-x-[16px]' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )}

        {isOwn && showTeamForm && (
          <div className="bg-white/[0.03] border border-white/8 rounded-lg p-4 mb-3">
            <div className="flex gap-2 mb-3">
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Name"
                className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25"
              />
              <input
                value={teamRole}
                onChange={(e) => setTeamRole(e.target.value)}
                placeholder="Role"
                className="w-32 bg-white/5 border border-white/10 rounded px-3 py-2 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="accent" size="sm" onClick={submitTeamMember} disabled={!teamName.trim()}>
                Save
              </Button>
              <Button variant="shell" size="sm" onClick={() => setShowTeamForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {project.team.length === 0 ? (
          <p className="font-sans text-[0.8125rem] text-dark-muted mb-3">No team members listed yet.</p>
        ) : (
          <div className="flex flex-col gap-2 mb-3">
            {project.team.map((member) => (
              <div key={member.id} className="flex items-center justify-between gap-2 bg-white/[0.03] border border-white/8 rounded-lg px-3.5 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={member.name} theme="dashboard" size="sm" />
                  <div className="min-w-0">
                    <div className="font-sans text-[0.8125rem] font-medium text-dark-text truncate">{member.name}</div>
                    <div className="font-sans text-[13px] text-dark-muted truncate">{member.role}</div>
                  </div>
                </div>
                {isOwn && (
                  <button
                    onClick={() => removeTeamMember(member.id)}
                    aria-label={`Remove ${member.name}`}
                    className="flex-shrink-0 text-dark-muted hover:text-white/80"
                  >
                    <X size={12} strokeWidth={2} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {isOwn && project.openToRecruitment && (
          <div>
            <LabelCaps className="block mb-2">
              Join requests{project.joinRequests.length > 0 ? ` (${project.joinRequests.length})` : ''}
            </LabelCaps>
            {project.joinRequests.length === 0 ? (
              <p className="font-sans text-[0.8125rem] text-dark-muted">No requests yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {project.joinRequests.map((n) => (
                  <span key={n} className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 bg-white/6 border border-white/10 font-sans text-[0.75rem] text-white/80">
                    {n}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {!isOwn && project.openToRecruitment && (
          <Button
            variant={hasRequestedToJoin ? 'done' : 'accent'}
            size="sm"
            onClick={() => toggleJoinRequest(project.id, myName)}
          >
            {hasRequestedToJoin ? <Check size={13} strokeWidth={2.2} /> : <UserPlus size={13} strokeWidth={1.8} />}
            {hasRequestedToJoin ? 'Requested' : 'Ask to join'}
          </Button>
        )}
      </section>

      {/* Feedback */}
      <section>
        <LabelCaps className="block mb-3">Feedback</LabelCaps>
        {project.feedback.length === 0 ? (
          <p className="font-sans text-[0.8125rem] text-dark-muted">No feedback yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {project.feedback.map((fb) => (
              <div key={fb.id} className="bg-white/[0.03] border border-white/8 rounded-lg p-4">
                <span className="font-sans text-[0.8125rem] font-medium text-white/85 block mb-1.5">{fb.fromName}</span>
                <p className="font-sans text-[0.8125rem] leading-snug text-white/65">{fb.text}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
