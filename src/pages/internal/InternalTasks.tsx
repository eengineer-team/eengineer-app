import * as React from 'react'
import * as internalApi from '@/lib/api/internal'
import { errorMessage, cn } from '@/lib/utils'

// The point of this page: team members drop in fixes/change requests as
// they spot them, whoever's doing dev work works the board left-to-right.
// No assignment system, no auth beyond the shared internal_admins allowlist
// -- author_name/claimed_by are free text (see 20260730120000_internal_tasks.sql)
// so this stays simple for a small team. Round 2 (20260730133000) added due
// dates, categories, screenshots, comments and a tiny team roster -- all
// deliberately lean on storage (see that migration's header comment).

const AUTHOR_NAME_KEY = 'eengineer_internal_author_name'
const STALE_DAYS = 3

const STATUS_COLUMNS: { status: internalApi.TaskStatus; label: string }[] = [
  { status: 'open', label: 'Open' },
  { status: 'in_progress', label: 'In progress' },
  { status: 'done', label: 'Done' },
]

const PRIORITY_STYLE: Record<internalApi.TaskPriority, string> = {
  high: 'bg-red-500/15 text-red-300 border-red-500/25',
  medium: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  low: 'bg-[#F0F0F0]/10 text-[#F0F0F0]/60 border-[#F0F0F0]/15',
}

const CATEGORY_LABEL: Record<internalApi.TaskCategory, string> = {
  bug: 'Bug',
  content: 'Content',
  design: 'Design',
  feature: 'Feature',
  other: 'Other',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDueDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function isOverdue(dueDate: string | null, status: internalApi.TaskStatus) {
  if (!dueDate || status === 'done') return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(`${dueDate}T00:00:00`) < today
}

function daysOpen(createdAt: string) {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
}

function inputClass() {
  return 'w-full bg-[#F0F0F0]/[0.04] border border-[#F0F0F0]/12 rounded px-3 py-2 font-sans text-[0.8125rem] text-[#F0F0F0] placeholder:text-[#F0F0F0]/30 focus:outline-none focus:border-[#F0F0F0]/35'
}

// ── Stats bar ────────────────────────────────────────────────────────────

function StatsBar({ tasks }: { tasks: internalApi.InternalTask[] }) {
  const open = tasks.filter((t) => t.status === 'open').length
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const doneThisWeek = tasks.filter((t) => t.status === 'done' && new Date(t.updatedAt).getTime() >= oneWeekAgo).length
  const stale = tasks.filter((t) => t.status !== 'done' && daysOpen(t.createdAt) > STALE_DAYS).length

  const items: { label: string; value: number; warn?: boolean }[] = [
    { label: 'Open', value: open },
    { label: 'In progress', value: inProgress },
    { label: 'Done this week', value: doneThisWeek },
    { label: `Stale (>${STALE_DAYS}d)`, value: stale, warn: stale > 0 },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      {items.map((item) => (
        <div key={item.label} className="border border-[#F0F0F0]/10 rounded-lg px-3.5 py-3">
          <p className={cn('font-sans text-[1.375rem] leading-none mb-1', item.warn ? 'text-amber-300' : 'text-[#F0F0F0]')}>
            {item.value}
          </p>
          <p className="font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45">{item.label}</p>
        </div>
      ))}
    </div>
  )
}

// ── Filters ──────────────────────────────────────────────────────────────

export interface Filters {
  category: internalApi.TaskCategory | 'all'
  author: string
  claimedBy: string
}

function FilterBar({
  tasks,
  filters,
  onChange,
}: {
  tasks: internalApi.InternalTask[]
  filters: Filters
  onChange: (f: Filters) => void
}) {
  const authors = Array.from(new Set(tasks.map((t) => t.authorName))).sort()
  const claimers = Array.from(new Set(tasks.map((t) => t.claimedBy).filter((v): v is string => !!v))).sort()

  return (
    <div className="flex flex-wrap gap-2 mb-5">
      <select
        value={filters.category}
        onChange={(e) => onChange({ ...filters, category: e.target.value as Filters['category'] })}
        className="bg-[#F0F0F0]/[0.04] border border-[#F0F0F0]/12 rounded px-2.5 py-1.5 font-sans text-[0.75rem] text-[#F0F0F0]"
      >
        <option value="all">All categories</option>
        {(Object.keys(CATEGORY_LABEL) as internalApi.TaskCategory[]).map((c) => (
          <option key={c} value={c}>
            {CATEGORY_LABEL[c]}
          </option>
        ))}
      </select>
      <select
        value={filters.author}
        onChange={(e) => onChange({ ...filters, author: e.target.value })}
        className="bg-[#F0F0F0]/[0.04] border border-[#F0F0F0]/12 rounded px-2.5 py-1.5 font-sans text-[0.75rem] text-[#F0F0F0]"
      >
        <option value="">Anyone raised it</option>
        {authors.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
      <select
        value={filters.claimedBy}
        onChange={(e) => onChange({ ...filters, claimedBy: e.target.value })}
        className="bg-[#F0F0F0]/[0.04] border border-[#F0F0F0]/12 rounded px-2.5 py-1.5 font-sans text-[0.75rem] text-[#F0F0F0]"
      >
        <option value="">Anyone's working it</option>
        {claimers.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      {(filters.category !== 'all' || filters.author || filters.claimedBy) && (
        <button
          onClick={() => onChange({ category: 'all', author: '', claimedBy: '' })}
          className="font-sans text-[0.75rem] text-[#F0F0F0]/50 hover:text-[#F0F0F0] px-2 py-1.5"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}

// ── Add task form ────────────────────────────────────────────────────────

function AddTaskForm({
  teamMembers,
  onCreated,
}: {
  teamMembers: internalApi.TeamMember[]
  onCreated: (task: internalApi.InternalTask) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [pageUrl, setPageUrl] = React.useState('')
  const [priority, setPriority] = React.useState<internalApi.TaskPriority>('medium')
  const [category, setCategory] = React.useState<internalApi.TaskCategory | ''>('')
  const [dueDate, setDueDate] = React.useState('')
  const [authorName, setAuthorName] = React.useState(() => localStorage.getItem(AUTHOR_NAME_KEY) ?? '')
  const [screenshotFile, setScreenshotFile] = React.useState<File | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !authorName.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      localStorage.setItem(AUTHOR_NAME_KEY, authorName.trim())
      const task = await internalApi.createTask({
        title,
        description,
        pageUrl,
        priority,
        authorName,
        dueDate: dueDate || null,
        category: category || null,
        screenshotFile,
      })
      onCreated(task)
      setTitle('')
      setDescription('')
      setPageUrl('')
      setPriority('medium')
      setCategory('')
      setDueDate('')
      setScreenshotFile(null)
      setOpen(false)
    } catch (err) {
      setError(errorMessage(err, 'Could not add the task.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mb-5 font-sans text-[0.8125rem] font-semibold text-[#1D1C1C] bg-[#F0F0F0] rounded px-3.5 py-2 hover:opacity-90 transition-opacity"
      >
        + New task
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 border border-[#F0F0F0]/12 rounded-lg p-4">
      <datalist id="internal-team-names">
        {teamMembers.map((m) => (
          <option key={m.name} value={m.name} />
        ))}
      </datalist>

      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <div className="sm:col-span-2">
          <label className="block font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 mb-1.5">
            What needs fixing / changing
          </label>
          <input
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Hero logo marquee overlaps on mobile"
            className={inputClass()}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 mb-1.5">
            Details (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Steps to reproduce, what it should look like, etc."
            className={cn(inputClass(), 'resize-none')}
          />
        </div>
        <div>
          <label className="block font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 mb-1.5">
            Page URL (optional)
          </label>
          <input
            value={pageUrl}
            onChange={(e) => setPageUrl(e.target.value)}
            placeholder="/dashboard/community"
            className={inputClass()}
          />
        </div>
        <div>
          <label className="block font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 mb-1.5">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as internalApi.TaskPriority)}
            className={cn(inputClass(), 'appearance-none')}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <label className="block font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 mb-1.5">
            Category (optional)
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as internalApi.TaskCategory | '')}
            className={cn(inputClass(), 'appearance-none')}
          >
            <option value="">None</option>
            {(Object.keys(CATEGORY_LABEL) as internalApi.TaskCategory[]).map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 mb-1.5">
            Due date (optional)
          </label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass()} />
        </div>
        <div>
          <label className="block font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 mb-1.5">
            Your name
          </label>
          <input
            required
            list="internal-team-names"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Who's flagging this?"
            className={inputClass()}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 mb-1.5">
            Screenshot (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setScreenshotFile(e.target.files?.[0] ?? null)}
            className="w-full font-sans text-[0.75rem] text-[#F0F0F0]/60 file:mr-3 file:font-sans file:text-[0.75rem] file:bg-[#F0F0F0]/10 file:text-[#F0F0F0] file:border-0 file:rounded file:px-3 file:py-1.5 file:cursor-pointer"
          />
        </div>
      </div>

      {error && (
        <p className="font-sans text-[0.8125rem] text-red-400 mb-3" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="font-sans text-[0.8125rem] font-semibold text-[#1D1C1C] bg-[#F0F0F0] rounded px-3.5 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {submitting ? 'Adding…' : 'Add task'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="font-sans text-[0.8125rem] text-[#F0F0F0]/60 hover:text-[#F0F0F0] rounded px-3.5 py-2 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ── Comments ─────────────────────────────────────────────────────────────

function CommentThread({ taskId }: { taskId: string }) {
  const [comments, setComments] = React.useState<internalApi.TaskComment[] | null>(null)
  const [body, setBody] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    internalApi.fetchComments(taskId).then(setComments).catch(() => setComments([]))
  }, [taskId])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    const authorName = localStorage.getItem(AUTHOR_NAME_KEY) || prompt('Your name?') || ''
    if (!authorName.trim()) return
    setSubmitting(true)
    try {
      const comment = await internalApi.addComment(taskId, authorName, body)
      setComments((prev) => (prev ? [...prev, comment] : [comment]))
      setBody('')
    } catch {
      // no-op -- user can retry
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-2.5 pt-2.5 border-t border-[#F0F0F0]/8">
      {comments === null ? (
        <p className="font-sans text-[0.6875rem] text-[#F0F0F0]/35">Loading comments…</p>
      ) : (
        <div className="flex flex-col gap-1.5 mb-2">
          {comments.map((c) => (
            <p key={c.id} className="font-sans text-[0.75rem] text-[#F0F0F0]/70 leading-snug">
              <span className="text-[#F0F0F0]/40">{c.authorName}:</span> {c.body}
            </p>
          ))}
          {comments.length === 0 && <p className="font-sans text-[0.6875rem] text-[#F0F0F0]/30">No comments yet.</p>}
        </div>
      )}
      <form onSubmit={submit} className="flex gap-1.5">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Ask a question, leave a note…"
          className="flex-1 bg-[#F0F0F0]/[0.04] border border-[#F0F0F0]/12 rounded px-2.5 py-1.5 font-sans text-[0.75rem] text-[#F0F0F0] placeholder:text-[#F0F0F0]/30 focus:outline-none focus:border-[#F0F0F0]/35"
        />
        <button
          type="submit"
          disabled={submitting}
          className="font-sans text-[0.6875rem] text-[#F0F0F0]/70 hover:text-[#F0F0F0] border border-[#F0F0F0]/12 rounded px-2.5 py-1.5 transition-colors disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  )
}

// ── Task card ────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onChange,
  onDeleted,
}: {
  task: internalApi.InternalTask
  onChange: (task: internalApi.InternalTask) => void
  onDeleted: (id: string) => void
}) {
  const [busy, setBusy] = React.useState(false)
  const [showComments, setShowComments] = React.useState(false)
  const overdue = isOverdue(task.dueDate, task.status)

  async function move(status: internalApi.TaskStatus) {
    setBusy(true)
    try {
      await internalApi.setTaskStatus(task.id, status)
      onChange({ ...task, status })
    } catch {
      // Swallow -- the board just won't move; user can retry the click.
    } finally {
      setBusy(false)
    }
  }

  async function toggleClaim() {
    const name = task.claimedBy ? null : (localStorage.getItem(AUTHOR_NAME_KEY) ?? prompt('Your name?') ?? '').trim() || null
    setBusy(true)
    try {
      await internalApi.claimTask(task.id, name)
      onChange({ ...task, claimedBy: name })
    } catch {
      // no-op, see move()
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!confirm('Delete this task?')) return
    setBusy(true)
    try {
      await internalApi.deleteTask(task.id)
      onDeleted(task.id)
    } catch {
      setBusy(false)
    }
  }

  return (
    <div className={cn('border rounded-lg p-3.5 bg-[#F0F0F0]/[0.02]', overdue ? 'border-red-500/35' : 'border-[#F0F0F0]/10')}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="font-sans text-[0.8125rem] text-[#F0F0F0] leading-snug">{task.title}</p>
        <span
          className={cn(
            'shrink-0 font-sans text-[10px] tracking-wide uppercase border rounded px-1.5 py-0.5',
            PRIORITY_STYLE[task.priority]
          )}
        >
          {task.priority}
        </span>
      </div>

      {(task.category || task.dueDate) && (
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          {task.category && (
            <span className="font-sans text-[10px] tracking-wide uppercase text-[#F0F0F0]/55 bg-[#F0F0F0]/8 rounded px-1.5 py-0.5">
              {CATEGORY_LABEL[task.category]}
            </span>
          )}
          {task.dueDate && (
            <span
              className={cn(
                'font-sans text-[10px] tracking-wide uppercase rounded px-1.5 py-0.5',
                overdue ? 'bg-red-500/15 text-red-300' : 'text-[#F0F0F0]/45 bg-[#F0F0F0]/8'
              )}
            >
              {overdue ? 'Overdue · ' : 'Due '}
              {formatDueDate(task.dueDate)}
            </span>
          )}
        </div>
      )}

      {task.description && (
        <p className="font-sans text-[0.75rem] text-[#F0F0F0]/55 leading-snug mb-2 whitespace-pre-wrap">
          {task.description}
        </p>
      )}

      {task.pageUrl && (
        <p className="font-sans text-[0.75rem] text-[#F0F0F0]/45 mb-2 truncate">
          <span className="text-[#F0F0F0]/30">page: </span>
          {task.pageUrl}
        </p>
      )}

      {task.screenshotUrl && (
        <a href={task.screenshotUrl} target="_blank" rel="noreferrer" className="block mb-2">
          <img
            src={task.screenshotUrl}
            alt="Screenshot"
            className="max-h-[120px] rounded border border-[#F0F0F0]/10 object-cover"
          />
        </a>
      )}

      <div className="flex items-center justify-between gap-2 mb-2.5">
        <p className="font-sans text-[0.6875rem] text-[#F0F0F0]/35">
          {task.authorName} · {formatDate(task.createdAt)}
        </p>
        {task.claimedBy && (
          <span className="font-sans text-[0.6875rem] text-[#F0F0F0]/55 bg-[#F0F0F0]/8 rounded px-1.5 py-0.5">
            {task.claimedBy}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {task.status !== 'open' && (
          <button
            disabled={busy}
            onClick={() => void move('open')}
            className="font-sans text-[0.6875rem] text-[#F0F0F0]/60 hover:text-[#F0F0F0] border border-[#F0F0F0]/12 rounded px-2 py-1 transition-colors disabled:opacity-40"
          >
            Reopen
          </button>
        )}
        {task.status !== 'in_progress' && (
          <button
            disabled={busy}
            onClick={() => void move('in_progress')}
            className="font-sans text-[0.6875rem] text-[#F0F0F0]/60 hover:text-[#F0F0F0] border border-[#F0F0F0]/12 rounded px-2 py-1 transition-colors disabled:opacity-40"
          >
            {task.status === 'open' ? 'Start' : 'Move back'}
          </button>
        )}
        {task.status !== 'done' && (
          <button
            disabled={busy}
            onClick={() => void move('done')}
            className="font-sans text-[0.6875rem] text-[#1D1C1C] bg-[#F0F0F0]/80 hover:bg-[#F0F0F0] rounded px-2 py-1 transition-colors disabled:opacity-40"
          >
            Mark done
          </button>
        )}
        <button
          disabled={busy}
          onClick={() => void toggleClaim()}
          className="font-sans text-[0.6875rem] text-[#F0F0F0]/60 hover:text-[#F0F0F0] border border-[#F0F0F0]/12 rounded px-2 py-1 transition-colors disabled:opacity-40"
        >
          {task.claimedBy ? 'Unclaim' : "I'm on it"}
        </button>
        <button
          onClick={() => setShowComments((v) => !v)}
          className="font-sans text-[0.6875rem] text-[#F0F0F0]/60 hover:text-[#F0F0F0] border border-[#F0F0F0]/12 rounded px-2 py-1 transition-colors"
        >
          {showComments ? 'Hide comments' : 'Comments'}
        </button>
        <button
          disabled={busy}
          onClick={() => void remove()}
          className="ml-auto font-sans text-[0.6875rem] text-[#F0F0F0]/35 hover:text-red-400 px-1 transition-colors disabled:opacity-40"
        >
          Delete
        </button>
      </div>

      {showComments && <CommentThread taskId={task.id} />}
    </div>
  )
}

// ── Recently shipped (derived from done tasks, no separate table) ──────────

function RecentlyShipped({ tasks }: { tasks: internalApi.InternalTask[] }) {
  const [open, setOpen] = React.useState(false)
  const shipped = tasks
    .filter((t) => t.status === 'done')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10)

  return (
    <div className="mt-8 border-t border-[#F0F0F0]/10 pt-5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 hover:text-[#F0F0F0]/70 transition-colors"
      >
        {open ? '▾' : '▸'} Recently shipped ({shipped.length})
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-1.5">
          {shipped.map((t) => (
            <p key={t.id} className="font-sans text-[0.75rem] text-[#F0F0F0]/60">
              <span className="text-[#F0F0F0]/30">{formatDate(t.updatedAt)}</span> — {t.title}
              {t.claimedBy && <span className="text-[#F0F0F0]/35"> · {t.claimedBy}</span>}
            </p>
          ))}
          {shipped.length === 0 && <p className="font-sans text-[0.75rem] text-[#F0F0F0]/30">Nothing shipped yet.</p>}
        </div>
      )}
    </div>
  )
}

// ── Team roster ──────────────────────────────────────────────────────────

function TeamRoster({
  members,
  onChange,
}: {
  members: internalApi.TeamMember[]
  onChange: (members: internalApi.TeamMember[]) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState('')
  const [role, setRole] = React.useState('')

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !role.trim()) return
    try {
      await internalApi.upsertTeamMember(name, role)
      const next = [...members.filter((m) => m.name !== name.trim()), { name: name.trim(), role: role.trim() }].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
      onChange(next)
      setName('')
      setRole('')
    } catch {
      // no-op
    }
  }

  async function remove(memberName: string) {
    try {
      await internalApi.deleteTeamMember(memberName)
      onChange(members.filter((m) => m.name !== memberName))
    } catch {
      // no-op
    }
  }

  return (
    <div className="mt-5 border-t border-[#F0F0F0]/10 pt-5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 hover:text-[#F0F0F0]/70 transition-colors"
      >
        {open ? '▾' : '▸'} Team ({members.length})
      </button>
      {open && (
        <div className="mt-3">
          <div className="flex flex-col gap-1.5 mb-3">
            {members.map((m) => (
              <div key={m.name} className="flex items-center justify-between gap-2 font-sans text-[0.75rem]">
                <span className="text-[#F0F0F0]/80">
                  {m.name} <span className="text-[#F0F0F0]/35">— {m.role}</span>
                </span>
                <button onClick={() => void remove(m.name)} className="text-[#F0F0F0]/30 hover:text-red-400 transition-colors">
                  Remove
                </button>
              </div>
            ))}
            {members.length === 0 && <p className="font-sans text-[0.75rem] text-[#F0F0F0]/30">No one listed yet.</p>}
          </div>
          <form onSubmit={add} className="flex gap-1.5">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={inputClass()} />
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role (e.g. frontend)" className={inputClass()} />
            <button
              type="submit"
              className="shrink-0 font-sans text-[0.75rem] text-[#F0F0F0]/70 hover:text-[#F0F0F0] border border-[#F0F0F0]/12 rounded px-3 py-2 transition-colors"
            >
              Add
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────

export function InternalTasks() {
  const [tasks, setTasks] = React.useState<internalApi.InternalTask[] | null>(null)
  const [teamMembers, setTeamMembers] = React.useState<internalApi.TeamMember[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [filters, setFilters] = React.useState<Filters>({ category: 'all', author: '', claimedBy: '' })

  React.useEffect(() => {
    internalApi
      .fetchTasks()
      .then(setTasks)
      .catch((err) => setError(errorMessage(err, 'Failed to load tasks.')))
    internalApi.fetchTeamMembers().then(setTeamMembers).catch(() => setTeamMembers([]))
  }, [])

  function applyChange(updated: internalApi.InternalTask) {
    setTasks((prev) => (prev ? prev.map((t) => (t.id === updated.id ? updated : t)) : prev))
  }

  function applyDelete(id: string) {
    setTasks((prev) => (prev ? prev.filter((t) => t.id !== id) : prev))
  }

  if (error) return <p className="font-sans text-[0.8125rem] text-red-400">{error}</p>
  if (!tasks) return <p className="font-sans text-[0.8125rem] text-[#F0F0F0]/50">Loading…</p>

  const filtered = tasks.filter(
    (t) =>
      (filters.category === 'all' || t.category === filters.category) &&
      (!filters.author || t.authorName === filters.author) &&
      (!filters.claimedBy || t.claimedBy === filters.claimedBy)
  )

  return (
    <div>
      <StatsBar tasks={tasks} />
      <AddTaskForm teamMembers={teamMembers} onCreated={(task) => setTasks((prev) => (prev ? [task, ...prev] : [task]))} />
      <FilterBar tasks={tasks} filters={filters} onChange={setFilters} />

      <div className="grid sm:grid-cols-3 gap-4">
        {STATUS_COLUMNS.map((col) => {
          const items = filtered.filter((t) => t.status === col.status)
          return (
            <div key={col.status}>
              <p className="font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 mb-2.5">
                {col.label} · {items.length}
              </p>
              <div className="flex flex-col gap-2.5">
                {items.map((task) => (
                  <TaskCard key={task.id} task={task} onChange={applyChange} onDeleted={applyDelete} />
                ))}
                {items.length === 0 && (
                  <p className="font-sans text-[0.75rem] text-[#F0F0F0]/25 border border-dashed border-[#F0F0F0]/10 rounded-lg px-3 py-6 text-center">
                    Nothing here
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <RecentlyShipped tasks={tasks} />
      <TeamRoster members={teamMembers} onChange={setTeamMembers} />
    </div>
  )
}
