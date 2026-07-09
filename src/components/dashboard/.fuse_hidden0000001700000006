import { Bell, MessageSquare, Menu } from 'lucide-react'
import { SettingsMenu } from '@/components/SettingsMenu'

function IconBadge({ icon: Icon, count }: { icon: typeof Bell; count: number }) {
  return (
    <button
      className="relative w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover-white-tint rounded transition-colors duration-150"
      aria-label={count > 0 ? `${count} unread` : 'No new notifications'}
    >
      <Icon size={16} strokeWidth={1.8} />
      {count > 0 && (
        <span className="absolute top-1 right-1 w-[7px] h-[7px] rounded-full bg-corn-700" />
      )}
    </button>
  )
}

export function DashboardHeader({ name, onMenuClick }: { name: string; onMenuClick: () => void }) {
  return (
    <header className="flex items-center justify-between px-4 md:px-8 py-5 border-b border-white/8">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="md:hidden w-8 h-8 flex-shrink-0 flex items-center justify-center text-white/70 hover:text-white hover-white-tint rounded transition-colors duration-150"
        >
          <Menu size={18} strokeWidth={1.8} />
        </button>
        <span className="font-display text-white text-[1.25rem] font-bold tracking-[-0.02em] truncate">
          Hello, {name}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <IconBadge icon={MessageSquare} count={2} />
        <IconBadge icon={Bell} count={3} />
        <SettingsMenu variant="dark" />
      </div>
    </header>
  )
}
