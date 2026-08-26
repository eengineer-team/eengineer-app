import * as React from 'react'
import { Copy, ArrowUpRight, Sparkles } from 'lucide-react'
import { DrawCheck } from '@/components/dashboard/DrawCheck'
import { getCategoryIcon } from './CategoryTabs'
import { cn } from '@/lib/utils'
import type { Prompt } from '@/lib/prompt-categories'
import { isPromptNew } from '@/lib/prompt-categories'

export interface PromptCardProps {
  prompt: Prompt
  onSelect: (prompt: Prompt) => void
  onQuickCopy?: (prompt: Prompt) => void
  className?: string
}

function difficultyColor(difficulty: Prompt['difficulty']): string {
  switch (difficulty) {
    case 'starter':
      return 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
    case 'intermediate':
      return 'border-sky-500/30 text-sky-400 bg-sky-500/10'
    case 'advanced':
      return 'border-gold-dark/40 text-gold-dark bg-gold-dark/10'
    default:
      return 'border-white/10 text-dark-muted bg-white/5'
  }
}

export function PromptCard({
  prompt,
  onSelect,
  onQuickCopy,
  className,
}: PromptCardProps) {
  const [copied, setCopied] = React.useState(false)
  const isNew = isPromptNew(prompt.published_at)
  const CategoryIcon = prompt.category?.slug ? getCategoryIcon(prompt.category.slug) : null

  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(prompt.prompt_text)
    setCopied(true)
    if (onQuickCopy) onQuickCopy(prompt)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(prompt)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(prompt)
        }
      }}
      className={cn(
        'group relative flex flex-col justify-between text-left',
        'bg-dark-surface border border-white/8 hover:border-gold-dark/40 hover:bg-white/[0.02]',
        'transition-all duration-200 rounded-xl p-5 cursor-pointer shadow-sm hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]',
        className
      )}
    >
      {/* Header Row: Category, Difficulty & New badge */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {prompt.category?.label && (
              <span className="inline-flex items-center gap-1.5 font-sans text-[11px] text-dark-muted font-medium bg-white/5 px-2 py-0.5 rounded border border-white/5">
                {CategoryIcon && <CategoryIcon size={12} className="text-gold-dark/80" />}
                <span>{prompt.category.label}</span>
              </span>
            )}
            <span
              className={cn(
                'font-mono text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded border',
                difficultyColor(prompt.difficulty)
              )}
            >
              {prompt.difficulty}
            </span>
          </div>

          {isNew && (
            <span className="bg-gold-dark/20 text-gold-dark text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border border-gold-dark/30">
              <Sparkles size={10} />
              <span>New</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-display text-[0.9375rem] font-semibold text-dark-text group-hover:text-gold-dark transition-colors duration-150 leading-snug line-clamp-2">
          {prompt.title}
        </h3>

        {/* Excerpt / When to use / Why it works */}
        <p className="font-sans text-[0.8125rem] text-dark-muted line-clamp-2 mt-2 leading-relaxed">
          {prompt.when_to_use || prompt.why_it_works || prompt.prompt_text.slice(0, 120) + '…'}
        </p>
      </div>

      {/* Footer Row: Tools Chips & Action */}
      <div className="mt-4 pt-3.5 border-t border-white/6 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
          {prompt.tools.slice(0, 3).map((tool) => (
            <span
              key={tool}
              className="font-mono text-[10.5px] text-dark-muted/80 bg-dark-surface2 px-2 py-0.5 rounded border border-white/5 truncate max-w-[130px]"
            >
              {tool}
            </span>
          ))}
          {prompt.tools.length > 3 && (
            <span className="font-mono text-[10px] text-dark-muted/60">
              +{prompt.tools.length - 3}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handleCopyClick}
            aria-label="Quick copy template"
            className="p-1.5 rounded text-dark-muted hover:text-gold-dark hover:bg-white/5 transition-colors"
            title="Quick copy template"
          >
            {copied ? (
              <span className="text-emerald-400">
                <DrawCheck animate={true} />
              </span>
            ) : (
              <Copy size={13} />
            )}
          </button>

          <span className="p-1.5 rounded text-dark-muted group-hover:text-gold-dark transition-colors">
            <ArrowUpRight size={14} />
          </span>
        </div>
      </div>
    </div>
  )
}
