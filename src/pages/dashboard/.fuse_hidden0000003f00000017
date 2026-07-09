import * as React from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor, Bell, Mail } from 'lucide-react'
import { LabelCaps } from '@/components/ui/label-caps'
import { cn } from '@/lib/utils'

const APPEARANCE_OPTIONS = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
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
      className={cn(
        'relative w-9 h-5 rounded-full flex-shrink-0 transition-colors duration-150',
        checked ? 'bg-gold-dark' : 'bg-white/15'
      )}
    >
      <span
        className={cn(
          'absolute top-[3px] w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-150',
          checked ? 'translate-x-[19px]' : 'translate-x-[3px]'
        )}
      />
    </button>
  )
}

// Step: real Settings page (sidebar link, not just the top-right dropdown).
// Appearance toggle genuinely flips next-themes' class attribute and persists
// via next-themes' own storage — but only the pre-auth Welcome/Auth/Help
// screens and a handful of shared components currently branch on it. The
// rest of the dashboard is unconditionally dark by design (see Sidebar.tsx
// history / docs/roadmap-for-team.md) and hasn't been given light-mode
// styling yet. Shipping the toggle now — with an honest caption instead of
// silently no-oping — beats blocking on a full light-mode pass everywhere.
export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [prefs, setPrefs] = React.useState<NotificationPrefs>(readStoredPrefs)

  React.useEffect(() => {
    window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs))
  }, [prefs])

  return (
    <div className="flex-1 px-8 py-8 max-w-[640px]">
      <h1 className="font-display text-xl font-semibold text-white/95 mb-1">Settings</h1>
      <p className="font-sans text-[0.8125rem] text-white/45 mb-8">
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
                  onClick={() => setTheme(opt.id)}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-1.5 py-3 rounded border font-sans text-[0.75rem] font-medium transition-colors duration-150',
                    active
                      ? 'border-gold-dark/50 bg-gold-dark/10 text-gold-dark'
                      : 'border-white/10 text-white/55 hover:text-white/85 hover:border-white/20'
                  )}
                >
                  <Icon size={16} strokeWidth={1.8} />
                  {opt.label}
                </button>
              )
            })}
          </div>
          <p className="font-sans text-[11px] text-white/35 leading-snug mt-3">
            Light mode is still rolling out across the dashboard — some screens will keep their
            current look until that pass is done.
          </p>
        </div>
      </section>

      <section>
        <LabelCaps className="block mb-3">Notifications</LabelCaps>
        <div className="bg-white/[0.03] border border-white/8 rounded-lg divide-y divide-white/8">
          <div className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <Mail size={16} strokeWidth={1.8} className="text-white/45 flex-shrink-0" />
              <div>
                <div className="font-sans text-[0.8125rem] font-medium text-white/90">Email digest</div>
                <div className="font-sans text-[11px] text-white/45">
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
              <Bell size={16} strokeWidth={1.8} className="text-white/45 flex-shrink-0" />
              <div>
                <div className="font-sans text-[0.8125rem] font-medium text-white/90">Mention alerts</div>
                <div className="font-sans text-[11px] text-white/45">
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
