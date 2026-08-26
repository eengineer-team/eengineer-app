import { Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCategoryIcon } from './CategoryTabs'
import { cn } from '@/lib/utils'
import type { Prompt } from '@/lib/prompt-categories'

export interface FeaturedPromptProps {
  prompt: Prompt
  onOpen: (prompt: Prompt) => void
  className?: string
}

export function FeaturedPrompt({
  prompt,
  onOpen,
  className,
}: FeaturedPromptProps) {
  const CategoryIcon = prompt.category?.slug ? getCategoryIcon(prompt.category.slug) : null

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-gold-dark/40 bg-gradient-to-br from-gold-dark/15 via-dark-surface to-dark-surface p-5 sm:p-7 shadow-[0_0_30px_rgba(199,154,58,0.1)] transition-all duration-200',
        className
      )}
    >
      {/* Subtle background glow effect */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-gold-dark/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col justify-between h-full gap-5">
        <div>
          {/* Eyebrow & Badges */}
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-gold-dark text-dark-900 font-sans text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                <Sparkles size={12} strokeWidth={2.5} />
                <span>Prompt of the Day</span>
              </span>
              {prompt.category?.label && (
                <span className="inline-flex items-center gap-1.5 font-sans text-xs text-dark-muted font-medium bg-white/5 px-2.5 py-1 rounded-full border border-white/8">
                  {CategoryIcon && <CategoryIcon size={13} className="text-gold-dark" />}
                  <span>{prompt.category.label}</span>
                </span>
              )}
            </div>

            <span className="font-mono text-[11px] uppercase tracking-wider text-gold-dark font-semibold bg-gold-dark/10 px-2.5 py-0.5 rounded-full border border-gold-dark/30">
              {prompt.difficulty}
            </span>
          </div>

          {/* Title */}
          <h2 className="font-display text-lg sm:text-xl font-bold text-dark-text leading-snug">
            {prompt.title}
          </h2>

          {/* When to use / Why It Works */}
          <p className="font-sans text-[0.8125rem] sm:text-sm text-dark-muted mt-2 leading-relaxed max-w-[700px]">
            {prompt.when_to_use ||
              prompt.why_it_works ||
              'Rigorous adversarial engineering template with strict negative constraints and verifiable failure mode analysis.'}
          </p>
        </div>

        {/* Footer: Tools & CTA */}
        <div className="flex items-center justify-between gap-4 pt-3 border-t border-white/8 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-sans text-[11px] text-dark-muted mr-1 hidden sm:inline">
              Optimized for:
            </span>
            {prompt.tools.map((tool) => (
              <span
                key={tool}
                className="font-mono text-[11px] text-dark-text/90 bg-dark-surface2 px-2.5 py-0.5 rounded border border-white/8"
              >
                {tool}
              </span>
            ))}
          </div>

          <Button
            type="button"
            variant="accent"
            size="sm"
            onClick={() => onOpen(prompt)}
            className="gap-2 text-xs font-semibold px-4 shadow-[0_0_15px_rgba(199,154,58,0.2)] ml-auto"
          >
            <span>Open in Editor</span>
            <ArrowRight size={13} strokeWidth={2} />
          </Button>
        </div>
      </div>
    </div>
  )
}
