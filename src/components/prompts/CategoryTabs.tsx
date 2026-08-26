import { Sparkles, Bot, Terminal, Users, Wrench, Palette, Layers, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CATEGORY_TABS } from '@/lib/prompt-categories'

export interface CategoryTabsProps {
  activeSlug: string
  onSelectCategory: (slug: string) => void
  counts?: Record<string, number>
  className?: string
}

export function getCategoryIcon(slug: string): LucideIcon {
  switch (slug) {
    case 'all':
      return Sparkles
    case 'chatbot':
      return Bot
    case 'agent':
      return Terminal
    case 'cowork':
      return Users
    case 'error-clinic':
      return Wrench
    case 'design':
      return Palette
    default:
      return Layers
  }
}

export function CategoryTabs({
  activeSlug,
  onSelectCategory,
  counts,
  className,
}: CategoryTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Prompt Categories"
      className={cn(
        'flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar',
        className
      )}
    >
      {CATEGORY_TABS.map((tab) => {
        const isActive = activeSlug === tab.slug
        const count = counts?.[tab.slug]
        const Icon = getCategoryIcon(tab.slug)

        return (
          <button
            key={tab.slug}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectCategory(tab.slug)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg font-sans text-xs sm:text-[13px] font-medium whitespace-nowrap transition-all duration-150 select-none cursor-pointer',
              isActive
                ? 'bg-gold-dark/15 text-gold-dark border border-gold-dark/30 shadow-[0_0_10px_rgba(199,154,58,0.12)]'
                : 'text-dark-muted hover:text-dark-text hover:bg-white/5 border border-transparent'
            )}
          >
            <Icon size={14} className={isActive ? 'text-gold-dark' : 'text-dark-muted/80'} />
            <span>{tab.label}</span>
            {count !== undefined && count > 0 && (
              <span
                className={cn(
                  'font-mono text-[10px] px-1.5 py-0.2 rounded-full',
                  isActive
                    ? 'bg-gold-dark/25 text-gold-dark font-semibold'
                    : 'bg-white/5 text-dark-muted'
                )}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

