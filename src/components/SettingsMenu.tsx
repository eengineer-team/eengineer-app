import { Settings, HelpCircle, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/auth-context'

// Dark/Light toggle intentionally absent from pre-auth Settings.
// Cornsilk is a fixed design decision for the welcome state, not a user preference.
// next-themes provider remains in the project for future post-auth accessibility use.
export function SettingsMenu({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const { user, signOut } = useAuth()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={
            variant === 'dark'
              ? 'w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/8 rounded transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30'
              : 'w-8 h-8 flex items-center justify-center text-corn-700 hover:text-corn-900 hover:bg-corn-900/6 rounded transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-corn-900/30'
          }
          aria-label="Settings"
        >
          <Settings size={15} strokeWidth={1.8} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link to="/help" className="flex items-center gap-2.5">
            <HelpCircle size={14} strokeWidth={1.8} />
            Help
          </Link>
        </DropdownMenuItem>
        {user?.status === 'builder' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={signOut} className="flex items-center gap-2.5">
              <LogOut size={14} strokeWidth={1.8} />
              Sign out
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
