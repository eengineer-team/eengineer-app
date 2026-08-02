import * as React from 'react'
import * as internalApi from '@/lib/api/internal'
import { DISCIPLINES, type Discipline } from '@/lib/community-data'
import { errorMessage, cn } from '@/lib/utils'

// The only place a webinar row can be created/edited at all -- previously
// insert-only-by-hand-over-SQL (see community-data.ts's Webinar doc
// comment). Exists specifically so speaker_photo_url/speaker_bio (added for
// the hero carousel, see 20260802060000_hero_carousel.sql) have somewhere
// to be set without a database console.

function inputClass() {
  return 'w-full bg-[#F0F0F0]/[0.04] border border-[#F0F0F0]/12 rounded px-3 py-2 font-sans text-[0.8125rem] text-[#F0F0F0] placeholder:text-[#F0F0F0]/30 focus:outline-none focus:border-[#F0F0F0]/35'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// datetime-local wants "YYYY-MM-DDTHH:mm" in local time, not a UTC ISO
// string -- this round-trips through the Date object's local getters rather
// than string-slicing the ISO value, which would silently use UTC fields.
function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface FormState {
  title: string
  discipline: Discipline
  speaker: string
  speakerPhotoUrl: string | null
  speakerBio: string
  startsAt: string
  durationMinutes: string
  meetingUrl: string
  description: string
}

const EMPTY_FORM: FormState = {
  title: '',
  discipline: 'Software',
  speaker: '',
  speakerPhotoUrl: null,
  speakerBio: '',
  startsAt: '',
  durationMinutes: '60',
  meetingUrl: '',
  description: '',
}

export function InternalWebinars() {
  const [webinars, setWebinars] = React.useState<internalApi.AdminWebinar[] | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM)
  const [uploading, setUploading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  const load = React.useCallback(() => {
    internalApi
      .fetchAdminWebinars()
      .then(setWebinars)
      .catch((err) => setError(errorMessage(err, 'Failed to load webinars.')))
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  function startCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setFormOpen(true)
  }

  function startEdit(w: internalApi.AdminWebinar) {
    setEditingId(w.id)
    setForm({
      title: w.title,
      discipline: w.discipline,
      speaker: w.speaker,
      speakerPhotoUrl: w.speakerPhotoUrl,
      speakerBio: w.speakerBio ?? '',
      startsAt: toDatetimeLocal(w.startsAt),
      durationMinutes: String(w.durationMinutes),
      meetingUrl: w.meetingUrl ?? '',
      description: w.description ?? '',
    })
    setFormError(null)
    setFormOpen(true)
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await internalApi.uploadSpeakerPhoto(file)
      setForm((f) => ({ ...f, speakerPhotoUrl: url }))
    } catch (err) {
      setFormError(errorMessage(err, 'Photo upload failed.'))
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.speaker.trim() || !form.startsAt) return
    setSaving(true)
    setFormError(null)
    try {
      const input: internalApi.AdminWebinarInput = {
        discipline: form.discipline,
        title: form.title,
        speaker: form.speaker,
        speakerPhotoUrl: form.speakerPhotoUrl,
        speakerBio: form.speakerBio,
        startsAt: new Date(form.startsAt).toISOString(),
        meetingUrl: form.meetingUrl,
        durationMinutes: Number(form.durationMinutes) || 60,
        description: form.description,
      }
      if (editingId) {
        await internalApi.updateWebinar(editingId, input)
      } else {
        await internalApi.createWebinar(input)
      }
      setFormOpen(false)
      load()
    } catch (err) {
      setFormError(errorMessage(err, 'Could not save the webinar.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this webinar?')) return
    try {
      await internalApi.deleteWebinar(id)
      setWebinars((prev) => (prev ? prev.filter((w) => w.id !== id) : prev))
    } catch (err) {
      setError(errorMessage(err, 'Could not delete the webinar.'))
    }
  }

  if (error) return <p className="font-sans text-[0.8125rem] text-red-400">{error}</p>
  if (!webinars) return <p className="font-sans text-[0.8125rem] text-[#F0F0F0]/50">Loading…</p>

  return (
    <div>
      <p className="font-sans text-[0.75rem] text-[#F0F0F0]/45 mb-4 leading-snug">
        Also feeds the hero carousel on the public landing page — a webinar with a photo and bio shows there
        automatically until it starts.
      </p>

      {!formOpen && (
        <button
          onClick={startCreate}
          className="mb-5 font-sans text-[0.8125rem] font-semibold text-[#1D1C1C] bg-[#F0F0F0] rounded px-3.5 py-2 hover:opacity-90 transition-opacity"
        >
          + New webinar
        </button>
      )}

      {formOpen && (
        <form onSubmit={handleSubmit} className="mb-6 border border-[#F0F0F0]/12 rounded-lg p-4">
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <div className="sm:col-span-2">
              <label className="block font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 mb-1.5">Title</label>
              <input
                required
                autoFocus
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Intro to Structural Analysis"
                className={inputClass()}
              />
            </div>
            <div>
              <label className="block font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 mb-1.5">
                Discipline
              </label>
              <select
                value={form.discipline}
                onChange={(e) => setForm((f) => ({ ...f, discipline: e.target.value as Discipline }))}
                className={cn(inputClass(), 'appearance-none')}
              >
                {DISCIPLINES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 mb-1.5">
                Starts at
              </label>
              <input
                required
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
                className={inputClass()}
              />
            </div>
            <div>
              <label className="block font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 mb-1.5">
                Speaker name
              </label>
              <input
                required
                value={form.speaker}
                onChange={(e) => setForm((f) => ({ ...f, speaker: e.target.value }))}
                placeholder="Who's giving it"
                className={inputClass()}
              />
            </div>
            <div>
              <label className="block font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 mb-1.5">
                Duration (minutes)
              </label>
              <input
                type="number"
                min={5}
                value={form.durationMinutes}
                onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                className={inputClass()}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 mb-1.5">
                Speaker photo
              </label>
              <div className="flex items-center gap-3">
                {form.speakerPhotoUrl && (
                  <img src={form.speakerPhotoUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-[#F0F0F0]/15" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => void handlePhotoChange(e)}
                  disabled={uploading}
                  className="flex-1 font-sans text-[0.75rem] text-[#F0F0F0]/60 file:mr-3 file:font-sans file:text-[0.75rem] file:bg-[#F0F0F0]/10 file:text-[#F0F0F0] file:border-0 file:rounded file:px-3 file:py-1.5 file:cursor-pointer"
                />
                {uploading && <span className="font-sans text-[0.6875rem] text-[#F0F0F0]/40">Uploading…</span>}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 mb-1.5">
                Speaker bio (shown on the hero carousel)
              </label>
              <textarea
                value={form.speakerBio}
                onChange={(e) => setForm((f) => ({ ...f, speakerBio: e.target.value }))}
                rows={2}
                placeholder="One or two sentences — who they are, why they're worth hearing from."
                className={cn(inputClass(), 'resize-none')}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 mb-1.5">
                Description (optional teaser)
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className={cn(inputClass(), 'resize-none')}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-sans text-[11px] tracking-wide uppercase text-[#F0F0F0]/45 mb-1.5">
                Meeting link (Zoom/Meet — sent to registrants, not shown publicly)
              </label>
              <input
                value={form.meetingUrl}
                onChange={(e) => setForm((f) => ({ ...f, meetingUrl: e.target.value }))}
                placeholder="https://..."
                className={inputClass()}
              />
            </div>
          </div>

          {formError && (
            <p className="font-sans text-[0.8125rem] text-red-400 mb-3" role="alert">
              {formError}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || uploading}
              className="font-sans text-[0.8125rem] font-semibold text-[#1D1C1C] bg-[#F0F0F0] rounded px-3.5 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create webinar'}
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="font-sans text-[0.8125rem] text-[#F0F0F0]/60 hover:text-[#F0F0F0] rounded px-3.5 py-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="border border-[#F0F0F0]/10 rounded-lg divide-y divide-[#F0F0F0]/6">
        {webinars.map((w) => (
          <div key={w.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              {w.speakerPhotoUrl ? (
                <img src={w.speakerPhotoUrl} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#F0F0F0]/10 flex items-center justify-center flex-shrink-0 font-sans text-[0.75rem] text-[#F0F0F0]/50">
                  {w.speaker.charAt(0).toUpperCase() || '?'}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-sans text-[0.8125rem] text-[#F0F0F0] truncate">{w.title}</p>
                <p className="font-sans text-[0.75rem] text-[#F0F0F0]/45 truncate">
                  {w.speaker} · {w.discipline} · {formatDate(w.startsAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => startEdit(w)}
                className="font-sans text-[0.75rem] text-[#F0F0F0]/70 hover:text-[#F0F0F0] transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => void handleDelete(w.id)}
                className="font-sans text-[0.75rem] text-[#F0F0F0]/35 hover:text-red-400 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {webinars.length === 0 && (
          <p className="font-sans text-[0.8125rem] text-[#F0F0F0]/40 px-4 py-6 text-center">No webinars yet.</p>
        )}
      </div>
    </div>
  )
}
