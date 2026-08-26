import * as React from 'react'
import { createPortal } from 'react-dom'
import { X, Lightbulb, Flame, Cpu, Sparkles } from 'lucide-react'
import { LabelCaps } from '@/components/ui/label-caps'
import { PromptVariableEditor } from './PromptVariableEditor'
import { getCategoryIcon } from './CategoryTabs'
import { recordPromptUsage } from '@/lib/api/prompt-lab'
import type { Prompt } from '@/lib/prompt-categories'
import { isPromptNew } from '@/lib/prompt-categories'
import { cn } from '@/lib/utils'

export interface PromptDetailProps {
  prompt: Prompt | null
  open: boolean
  onClose: () => void
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

export function PromptDetail({ prompt, open, onClose }: PromptDetailProps) {
  // Record view telemetry when opened
  React.useEffect(() => {
    if (open && prompt) {
      recordPromptUsage(prompt.id, 'view')
    }
  }, [open, prompt])

  // Close on Escape key
  React.useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open || !prompt) return null

  const isNew = isPromptNew(prompt.published_at)
  const CategoryIcon = prompt.category?.slug ? getCategoryIcon(prompt.category.slug) : null

  const handleCopySuccess = () => {
    recordPromptUsage(prompt.id, 'copy')
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-detail-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Container */}
      <div className="relative z-10 w-full max-w-[880px] max-h-[92vh] flex flex-col bg-dark-100 border border-white/12 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-start justify-between gap-4 p-5 sm:p-6 bg-dark-100/95 backdrop-blur border-b border-white/8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {prompt.category?.label && (
                <span className="inline-flex items-center gap-1.5 font-sans text-xs text-dark-muted font-medium bg-white/5 px-2.5 py-0.5 rounded-full border border-white/8">
                  {CategoryIcon && <CategoryIcon size={13} className="text-gold-dark" />}
                  <span>{prompt.category.label}</span>
                </span>
              )}
              <span
                className={cn(
                  'font-mono text-[11px] uppercase font-semibold tracking-wider px-2.5 py-0.5 rounded-full border',
                  difficultyColor(prompt.difficulty)
                )}
              >
                {prompt.difficulty}
              </span>
              {isNew && (
                <span className="bg-gold-dark/20 text-gold-dark text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border border-gold-dark/30">
                  <Sparkles size={10} />
                  <span>New</span>
                </span>
              )}
            </div>

            <h2
              id="prompt-detail-title"
              className="font-display text-lg sm:text-xl font-bold text-dark-text leading-snug"
            >
              {prompt.title}
            </h2>

            {prompt.when_to_use && (
              <p className="font-sans text-xs sm:text-[0.8125rem] text-dark-muted/90 leading-relaxed mt-1">
                <span className="text-gold-dark font-medium mr-1.5">Когда использовать:</span>
                {prompt.when_to_use}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-dark-muted hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors flex-shrink-0"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* 1. Core UX: Interactive Variable Cell Editor */}
          <div>
            <LabelCaps className="text-gold-dark mb-2.5 block">
              1. Interactive Template & Variables
            </LabelCaps>
            <PromptVariableEditor
              promptText={prompt.prompt_text}
              variables={prompt.variables}
              onCopy={handleCopySuccess}
              autoFocusFirst={true}
            />
          </div>

          {/* 2. Pillars: Why It Works & Model Pro Tips */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Why It Works */}
            {prompt.why_it_works && (
              <div className="flex flex-col gap-2 bg-dark-surface p-4 rounded-xl border border-white/8">
                <div className="flex items-center gap-2 text-gold-dark font-sans text-xs font-semibold tracking-wide">
                  <Lightbulb size={15} />
                  <span>Why This Works (LLM Framing)</span>
                </div>
                <p className="font-sans text-xs sm:text-[0.8125rem] text-dark-muted leading-relaxed whitespace-pre-wrap">
                  {prompt.why_it_works}
                </p>
              </div>
            )}

            {/* Model-Specific Pro Tips */}
            {prompt.pro_tips && (
              <div className="flex flex-col gap-2 bg-dark-surface p-4 rounded-xl border border-white/8">
                <div className="flex items-center gap-2 text-amber-400 font-sans text-xs font-semibold tracking-wide">
                  <Flame size={15} />
                  <span>Model-Specific Pro Tips</span>
                </div>
                <p className="font-sans text-xs sm:text-[0.8125rem] text-dark-muted leading-relaxed whitespace-pre-wrap">
                  {prompt.pro_tips}
                </p>
              </div>
            )}
          </div>

          {/* 3. Recommended Tools & Invariants */}
          <div className="flex flex-col gap-3 bg-dark-surface p-4 rounded-xl border border-white/8">
            <div className="flex items-center gap-2 text-sky-400 font-sans text-xs font-semibold tracking-wide">
              <Cpu size={15} />
              <span>Recommended Tooling & Environments</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {prompt.tools.map((tool) => (
                <span
                  key={tool}
                  className="font-mono text-xs text-dark-text/90 bg-dark-surface2 px-2.5 py-1 rounded border border-white/10"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
