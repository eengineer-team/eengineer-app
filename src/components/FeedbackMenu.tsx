import * as React from 'react'
import { MessageSquarePlus, X } from 'lucide-react'

// General product-feedback affordance, next to SettingsMenu — same 8x8
// icon-button shape/hover convention (see SettingsMenu.tsx) so the two read
// as one control group, not two unrelated widgets.
//
// No feedback backend exists in this project. Rather than fake a "sent to
// our server" success state (a verifiable lie — nothing is actually stored
// or delivered anywhere), Send opens a mailto: to the same contact address
// already in the footer, pre-filled with what was typed. Real action: it
// hands off to the person's own email client instead of pretending.
export function FeedbackMenu({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const [open, setOpen] = React.useState(false)
  const [text, setText] = React.useState('')
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleSend() {
    const trimmed = text.trim()
    if (!trimmed) return
    const subject = encodeURIComponent('eengineer feedback')
    const body = encodeURIComponent(trimmed)
    window.location.href = `mailto:bshoxrux48@gmail.com?subject=${subject}&body=${body}`
    setText('')
    setOpen(false)
  }

  const iconButtonClass =
    variant === 'dark'
      ? 'w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/8 rounded transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30'
      : 'w-8 h-8 flex items-center justify-center text-corn-700 hover:text-corn-900 hover:bg-corn-900/6 rounded transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-corn-900/30'

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className={iconButtonClass} aria-label="Send feedback">
        <MessageSquarePlus size={15} strokeWidth={1.8} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-40 w-[300px] bg-corn-100 border border-corn-900/15 rounded-lg shadow-[0_12px_40px_rgba(42,33,24,0.18)] p-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="font-sans text-[11px] font-medium tracking-[0.16em] uppercase text-corn-700">
              Feedback
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-corn-700 hover:text-corn-900 transition-colors"
              aria-label="Close"
            >
              <X size={14} strokeWidth={1.8} />
            </button>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            autoFocus
            className="w-full bg-white/50 border border-corn-900/15 rounded px-2.5 py-2 font-sans text-[0.8125rem] text-[#2A2118] placeholder:text-corn-700/55 focus:outline-none focus:border-corn-900/35 resize-none mb-1.5"
            placeholder="What's working, what's not, what's missing..."
          />
          <p className="font-sans text-[10px] text-corn-700/80 mb-3 leading-snug">
            Opens your email client, addressed to us directly — no form, no server.
          </p>

          <div className="flex justify-end">
            <button
              onClick={handleSend}
              disabled={!text.trim()}
              className="font-sans text-[11px] font-semibold uppercase tracking-[0.05em] px-3.5 py-2 rounded bg-corn-900 text-corn-100 hover:bg-corn-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
