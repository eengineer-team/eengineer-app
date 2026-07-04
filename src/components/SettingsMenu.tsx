import { Settings, HelpCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

// Dark/Light toggle intentionally absent from pre-auth Settings.
// Cornsilk is a fixed design decision for the welcome state, not a user preference.
// next-themes provider remains in the project for future post-auth accessibility use.
export function SettingsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="
            w-8 h-8 flex items-center justify-center
            text-corn-700 hover:text-corn-900
            hover:bg-corn-900/6 rounded
            transition-all duration-150
            focus:outline-none focus-visible:ring-2 focus-visible:ring-corn-900/30
          "
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
