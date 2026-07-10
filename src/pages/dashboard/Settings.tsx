import * as React from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor, Bell, Mail } from 'lucide-react'
import { LabelCaps } from '@/components/ui/label-caps'
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

// Step: real Settings page (sidebar link, not just the top-right dropdown).
// The dashboard shell is unconditionally dark by design (see Sidebar.tsx
// history / docs/roadmap-for-team.md) and hasn't been given light-mode
// styling yet, so from inside the dashboard a Light/System toggle would look
// interactive but do nothing visible. Rather than ship a control that lies,
// Light/System are disabled here with an explicit "Dark only for now" state,
// and this page forces the shared next-themes value to 'dark' so it can't
// silently drift out of sync with what's actually on screen.
export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [prefs, setPrefs] = React.useState<NotificationPrefs>(readStoredPrefs)

  React.useEffect(() => {
    window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs))
  }, [prefs])

  React.useEffect(() => {
    if (theme !== 'dark') setTheme('dark')
  }, [theme, setTheme])

  return (
    <div className="flex-1 px-8 py-8 max-w-[640px]">
      <h1 className="font-display text-xl font-semibold text-dark-text mb-1">Settings</h1>
      <p className="font-sans text-[0.8125rem] text-dark-muted mb-8">
        Appearance and notification preferences.
      </p>

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
