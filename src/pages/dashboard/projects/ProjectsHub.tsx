import * as React from 'react'
import { Link } from 'react-router-dom'
import { Users, Rocket, Paperclip, FileText, X, Radio } from 'lucide-react'
import { useProjects } from '@/lib/projects-context'
import { useProfiles } from '@/lib/profiles-context'
import { useCurrentActivity } from '@/lib/current-activity-context'
import { ME_ID } from '@/lib/profile-data'
import { readFileAsAttachment, type Attachment } from '@/lib/attachments'
import { Avatar } from '@/components/ui/avatar'
import { Chip } from '@/components/ui/chip'
import { Button } from '@/components/ui/button'
import { LabelCaps } from '@/components/ui/label-caps'

function renderActivityAttachment(attachment: Attachment) {
  if (attachment.kind === 'image') {
    return <img src={attachment.url} alt="" className="max-w-full max-h-64 rounded object-cover mt-2" />
  }
  if (attachment.kind === 'video') {
    return <video src={attachment.url} controls className="max-w-full max-h-64 rounded mt-2" />
  }
  return (
    <a
      href={attachment.url}
      download={attachment.name}
      className="mt-2 inline-flex items-center gap-1.5 font-sans text-[12px] text-gold-dark underline underline-offset-2 decoration-current/40 hover:decoration-current"
    >
      <FileText size={13} strokeWidth={1.8} />
      {attachment.name ?? 'Attachment'}
    </a>
  )
}

export function ProjectsHub() {
  const { projects } = useProjects()
  const { getProfile } = useProfiles()
  const { activity, post } = useCurrentActivity()

  const myProject = projects.find((p) => p.ownerId === ME_ID)
  const hasMyProject = !!myProject?.name.trim()
  const me = getProfile(ME_ID)

  const [draft, setDraft] = React.useState('')
  const [pendingAttachment, setPendingAttachment] = React.useState<Attachment | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  function submitActivity() {
    if (!me) return
    post(me.name, me.discipline, draft, pendingAttachment ?? undefined)
    setDraft('')
    setPendingAttachment(null)
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    readFileAsAttachment(file).then(setPendingAttachment)
  }

  // Only real, filled-in projects show up for others to browse — an empty
  // seed row (like the signed-in Builder's own project before they've named
  // it) isn't something to show in a feed, same reasoning as PeerActivity's
  // "nothing posted yet" gate.
  const otherProjects = projects.filter((p) => p.ownerId !== ME_ID && p.name.trim())

  return (
    <div className="flex-1 px-4 md:px-8 py-6 md:py-8 max-w-[1180px]">
      <div className="flex items-center justify-between gap-4 mb-1">
        <h1 className="font-display text-xl font-semibold text-dark-text">Projects</h1>
        <Button variant={hasMyProject ? 'shell' : 'accent'} size="sm" asChild>
          <Link to="/dashboard/projects/mine">
            <Rocket size={14} strokeWidth={2} />
            {hasMyProject ? 'My Project' : 'Create your project'}
          </Link>
        </Button>
      </div>
      <p className="font-sans text-[0.8125rem] text-dark-muted mb-6">
        Post your own project to build a following and get feedback, or browse what other Builders are working on.
      </p>

      {/* Current Projects — a running "what are you building right now" feed,
          separate from the one-per-Builder Project below: quick status
          updates rather than a maintained portfolio entry. */}
      <div className="mb-10">
        <div className="flex items-center gap-1.5 mb-3">
          <Radio size={13} strokeWidth={2} className="text-dark-muted" />
          <LabelCaps>Current Projects</LabelCaps>
        </div>
        <p className="font-sans text-[0.8125rem] text-dark-muted mb-3 -mt-1.5">
          Share what you're building right now — a quick update, not a full project page.
        </p>

        <div className="bg-white/[0.03] border border-white/8 rounded-lg p-4 mb-4">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder="What are you working on right now?"
            className="w-full bg-white/5 border border-white/10 rounded px-3.5 py-2.5 font-sans text-[0.8125rem] text-dark-text placeholder:text-dark-muted focus:outline-none focus:border-white/25 resize-none mb-2"
          />
          {pendingAttachment && (
            <div className="flex items-center gap-2 mb-2 bg-white/6 border border-white/10 rounded px-3 py-2">
              {pendingAttachment.kind === 'image' ? (
                <img src={pendingAttachment.url} alt="" className="w-9 h-9 rounded object-cover flex-shrink-0" />
              ) : pendingAttachment.kind === 'video' ? (
                <video src={pendingAttachment.url} className="w-9 h-9 rounded object-cover flex-shrink-0" />
              ) : (
                <span className="w-9 h-9 rounded bg-white/8 flex items-center justify-center flex-shrink-0">
                  <FileText size={16} strokeWidth={1.8} className="text-dark-muted" />
                </span>
              )}
              <span className="flex-1 min-w-0 truncate font-sans text-[11px] text-white/60">
                {pendingAttachment.name ?? 'Attachment'}
              </span>
              <button
                onClick={() => setPendingAttachment(null)}
                aria-label="Remove attachment"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center text-dark-muted hover:text-white/80 transition-colors flex-shrink-0 -my-2 -mr-2"
              >
                <X size={14} strokeWidth={1.8} />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" onChange={handleFileSelected} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach a picture, video, or file"
              className="min-w-[36px] min-h-[36px] flex-shrink-0 flex items-center justify-center rounded text-dark-muted hover:text-white/85 hover-white-tint transition-colors"
            >
              <Paperclip size={15} strokeWidth={1.8} />
            </button>
            <Button variant="accent" size="sm" onClick={submitActivity} disabled={!draft.trim() && !pendingAttachment}>
              Post update
            </Button>
          </div>
        </div>

        {activity.length === 0 ? (
          <p className="font-sans text-[0.8125rem] text-dark-muted">No updates yet — be the first to share.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {activity.map((a) => (
              <div key={a.id} className="bg-white/[0.03] border border-white/8 rounded-lg p-4 flex gap-3">
                <Avatar name={a.name} size="md" theme="dashboard" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-sans text-[0.875rem] font-semibold text-dark-text truncate">{a.name}</span>
                      <Chip theme="dashboard" discipline={a.discipline}>{a.discipline}</Chip>
                    </div>
                    <span className="font-sans text-[10px] text-dark-muted flex-shrink-0">{a.time}</span>
                  </div>
                  <p className="font-sans text-[0.8125rem] text-dark-text leading-snug">{a.text}</p>
                  {a.attachment && renderActivityAttachment(a.attachment)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 mb-3">
        <Rocket size={13} strokeWidth={2} className="text-dark-muted" />
        <LabelCaps>Projects</LabelCaps>
      </div>

      {!hasMyProject && (
        <div className="flex items-center justify-between gap-4 bg-white/[0.03] border border-dashed border-white/15 rounded-lg p-4 mb-6">
          <div>
            <div className="font-sans text-[0.875rem] font-semibold text-dark-text mb-0.5">
              You haven't added a project yet
            </div>
            <p className="font-sans text-[0.8125rem] text-dark-muted">
              Give it a name and description — you can fill in the rest later.
            </p>
          </div>
          <Button variant="accent" size="sm" asChild className="flex-shrink-0">
            <Link to="/dashboard/projects/mine">Get started</Link>
          </Button>
        </div>
      )}

      {otherProjects.length === 0 ? (
        <p className="font-sans text-[0.8125rem] text-dark-muted">
          No projects posted yet — be the first.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {otherProjects.map((project) => {
            const owner = getProfile(project.ownerId)
            if (!owner) return null
            return (
              <Link
                key={project.id}
                to={`/dashboard/projects/${project.id}`}
                className="flex flex-col bg-white/[0.03] border border-white/8 rounded-lg overflow-hidden hover:border-white/20 hover:bg-white/[0.05] transition-colors duration-150"
              >
                <div
                  className="h-20 bg-gradient-to-br from-white/8 to-transparent bg-cover bg-center flex-shrink-0"
                  style={project.coverUrl ? { backgroundImage: `url(${project.coverUrl})` } : undefined}
                />
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar name={project.name} src={project.thumbnailUrl} theme="dashboard" size="sm" />
                    <h3 className="flex-1 min-w-0 font-sans text-[0.9375rem] font-semibold text-dark-text truncate">
                      {project.name}
                    </h3>
                  </div>
                  <p className="font-sans text-[0.8125rem] text-dark-muted leading-snug line-clamp-2 mb-3 flex-1">
                    {project.description || 'No description yet.'}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Chip theme="dashboard" discipline={owner.discipline}>{owner.discipline}</Chip>
                      <span className="font-sans text-[11px] text-dark-muted truncate">{owner.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-dark-muted flex-shrink-0">
                      <Users size={11} strokeWidth={1.8} />
                      <span className="font-sans text-[11px]">{project.followerIds.length}</span>
                    </div>
                  </div>
                  {project.openToRecruitment && (
                    <span className="inline-flex items-center self-start mt-2.5 rounded px-1.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-sans text-[10px] font-semibold uppercase tracking-wide">
                      Open to team recruitment
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
