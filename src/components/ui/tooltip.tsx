import { useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface TooltipProps {
  label: string
  children: ReactNode
  disabled?: boolean
  className?: string
}

// Portaled to <body> with fixed positioning rather than a CSS group-hover
// popover — the sidebar's nav list is a vertical scroll container
// (overflow-y-auto), which per spec forces overflow-x to auto too and would
// clip an absolutely-positioned tooltip at the rail's edge.
export function Tooltip({ label, children, disabled, className }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const ref = useRef<HTMLDivElement>(null)

  if (disabled) return <>{children}</>

  const show = () => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    setCoords({ top: rect.top + rect.height / 2, left: rect.right + 8 })
    setVisible(true)
  }
  const hide = () => setVisible(false)

  return (
    <div ref={ref} className={className} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      {visible &&
        createPortal(
          <span
            role="tooltip"
            style={{ top: coords.top, left: coords.left }}
            className={cn(
              'pointer-events-none fixed z-50 -translate-y-1/2 whitespace-nowrap rounded border border-white/10',
              'bg-dark-100 px-2 py-1 font-sans text-xs text-dark-text shadow-lg',
            )}
          >
            {label}
          </span>,
          document.body,
        )}
    </div>
  )
}
