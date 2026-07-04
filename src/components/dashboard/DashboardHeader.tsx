import { Bell, MessageSquare } from 'lucide-react'
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

export function DashboardHeader({ name }: { name: string }) {
  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-white/8">
      <span className="font-display text-white text-[1.25rem] font-bold tracking-[-0.02em]">
        Hello, {name}
      </span>

      <div className="flex items-center gap-1">
        <IconBadge icon={MessageSquare} count={2} />
        <IconBadge icon={Bell} count={3} />
        <SettingsMenu variant="dark" />
      </div>
    </header>
  )
}
