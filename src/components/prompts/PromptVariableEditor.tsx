import * as React from 'react'
import { Copy, RotateCcw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DrawCheck } from '@/components/dashboard/DrawCheck'
import { LabelCaps } from '@/components/ui/label-caps'
import { cn } from '@/lib/utils'
import type { PromptVariable } from '@/lib/prompt-categories'
import { extractVariableTokens, interpolatePrompt } from '@/lib/prompt-categories'

export interface PromptVariableEditorProps {
  promptText: string
  variables?: PromptVariable[]
  onCopy?: (finalPrompt: string) => void
  className?: string
  autoFocusFirst?: boolean
}

// Common token names that typically contain multiline text
const MULTILINE_KEYWORDS = [
  'CODE',
  'DIFF',
  'LOGS',
  'SCHEMA',
  'QUERIES',
  'SPEC',
  'SPECIFICATION',
  'DESCRIPTION',
  'NOTES',
  'ERROR',
  'OUTPUT',
  'DETAILS',
  'CONTEXT',
  'TOPOLOGY',
  'BODY',
]

function shouldBeMultiline(variable?: PromptVariable, tokenName?: string): boolean {
  if (variable?.is_multiline) return true
  if (!tokenName) return false
  const upper = tokenName.toUpperCase()
  return MULTILINE_KEYWORDS.some((kw) => upper.includes(kw))
}

export function PromptVariableEditor({
  promptText,
  variables = [],
  onCopy,
  className,
  autoFocusFirst = false,
}: PromptVariableEditorProps) {
  // Extract all tokens from prompt_text
  const tokens = React.useMemo(() => extractVariableTokens(promptText), [promptText])

  // Map known variables by token name
  const varMap = React.useMemo(() => {
    const map = new Map<string, PromptVariable>()
    variables.forEach((v) => map.set(v.name, v))
    return map
  }, [variables])

  // State for user input values
  const [values, setValues] = React.useState<Record<string, string>>({})
  const [copied, setCopied] = React.useState(false)
  const [showToast, setShowToast] = React.useState(false)
  const copyTimeoutRef = React.useRef<number | null>(null)

  // Initialize or maintain values
  const handleInputChange = (token: string, val: string) => {
    setValues((prev) => ({
      ...prev,
      [token]: val,
    }))
  }

  const handleReset = () => {
    setValues({})
    setCopied(false)
  }

  const interpolatedText = React.useMemo(
    () => interpolatePrompt(promptText, values),
    [promptText, values]
  )

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(interpolatedText)
      setCopied(true)
      setShowToast(true)
      if (onCopy) onCopy(interpolatedText)

      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
      copyTimeoutRef.current = window.setTimeout(() => {
        setCopied(false)
        setShowToast(false)
      }, 2500)
    } catch (err) {
      console.error('Failed to copy prompt to clipboard:', err)
    }
  }, [interpolatedText, onCopy])

  // Handle Cmd/Ctrl + Enter shortcut anywhere inside the editor
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleCopy()
    }
  }

  // Count filled variables
  const filledCount = tokens.filter((t) => (values[t] || '').trim().length > 0).length
  const totalTokens = tokens.length

  // Render tokens inside the live preview
  const renderLivePreview = () => {
    const regex = /\{\{([A-Za-z0-9_]+)\}\}/g
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null
    let keyIdx = 0

    while ((match = regex.exec(promptText)) !== null) {
      const precedingText = promptText.substring(lastIndex, match.index)
      if (precedingText) {
        parts.push(<span key={`text-${keyIdx++}`}>{precedingText}</span>)
      }

      const tokenName = match[1]
      const userVal = values[tokenName]

      if (userVal && userVal.trim().length > 0) {
        // Filled state: soft gold background and text
        parts.push(
          <span
            key={`token-${tokenName}-${keyIdx++}`}
            className="bg-gold-dark/15 text-gold-dark font-mono font-medium px-1.5 py-0.5 rounded border border-gold-dark/30 shadow-[0_0_8px_rgba(199,154,58,0.15)] transition-all duration-150"
            title={`Variable: {{${tokenName}}}`}
          >
            {userVal}
          </span>
        )
      } else {
        // Unfilled state: muted dim text
        parts.push(
          <span
            key={`unfilled-${tokenName}-${keyIdx++}`}
            className="text-white/30 font-mono bg-white/5 px-1 py-0.5 rounded border border-white/5 transition-colors"
            title={`Variable: {{${tokenName}}} (empty)`}
          >
            {`{{${tokenName}}}`}
          </span>
        )
      }

      lastIndex = regex.lastIndex
    }

    const trailingText = promptText.substring(lastIndex)
    if (trailingText) {
      parts.push(<span key={`text-trailing-${keyIdx++}`}>{trailingText}</span>)
    }

    return parts
  }

  return (
    <div
      className={cn('flex flex-col gap-5 w-full', className)}
      onKeyDown={handleKeyDown}
    >
      {/* Variable Cells Grid */}
      {totalTokens > 0 && (
        <div className="flex flex-col gap-3.5 bg-dark-surface p-4 sm:p-5 rounded-xl border border-white/8 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-gold-dark" />
              <LabelCaps className="text-dark-text tracking-wider">
                Variable Inputs
              </LabelCaps>
              <span className="font-mono text-[11px] text-dark-muted bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                {filledCount}/{totalTokens} filled
              </span>
            </div>
            {filledCount > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 font-sans text-xs text-dark-muted hover:text-dark-text transition-colors duration-150 px-2 py-1 rounded hover:bg-white/5"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3.5 pt-1">
            {tokens.map((token, idx) => {
              const meta = varMap.get(token)
              const isMulti = shouldBeMultiline(meta, token)
              const currentVal = values[token] || ''
              const isFilled = currentVal.trim().length > 0

              return (
                <div
                  key={token}
                  className={cn(
                    'flex flex-col gap-1.5 p-3 rounded-lg border transition-all duration-150',
                    isFilled
                      ? 'bg-dark-surface2/90 border-gold-dark/30 shadow-[0_0_12px_rgba(199,154,58,0.06)]'
                      : 'bg-dark-surface2/50 border-white/6 hover:border-white/12'
                  )}
                >
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <label
                      htmlFor={`var-${token}`}
                      className="font-mono text-xs font-semibold text-gold-dark tracking-wide flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="opacity-60 text-[10px]">&#123;&#123;</span>
                      {token}
                      <span className="opacity-60 text-[10px]">&#125;&#125;</span>
                    </label>
                    {meta?.description && (
                      <span className="font-sans text-[11px] text-dark-muted/80 leading-snug">
                        {meta.description}
                      </span>
                    )}
                  </div>

                  {isMulti ? (
                    <textarea
                      id={`var-${token}`}
                      value={currentVal}
                      onChange={(e) => handleInputChange(token, e.target.value)}
                      rows={3}
                      autoFocus={autoFocusFirst && idx === 0}
                      placeholder={
                        meta?.description
                          ? `Paste or type ${meta.description.toLowerCase()}…`
                          : `Enter ${token.toLowerCase()} value…`
                      }
                      className="w-full bg-white/[0.04] border border-white/10 focus:border-gold-dark/50 focus:bg-white/[0.07] rounded px-3 py-2 font-mono text-xs text-dark-text placeholder:text-dark-muted/40 focus:outline-none transition-all resize-y leading-relaxed"
                    />
                  ) : (
                    <input
                      id={`var-${token}`}
                      type="text"
                      value={currentVal}
                      onChange={(e) => handleInputChange(token, e.target.value)}
                      autoFocus={autoFocusFirst && idx === 0}
                      placeholder={
                        meta?.description
                          ? `e.g. ${meta.description}`
                          : `Enter ${token.toLowerCase()}…`
                      }
                      className="w-full bg-white/[0.04] border border-white/10 focus:border-gold-dark/50 focus:bg-white/[0.07] rounded px-3 py-2 font-sans text-xs text-dark-text placeholder:text-dark-muted/40 focus:outline-none transition-all"
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Live Preview Viewport */}
      <div className="flex flex-col gap-2 bg-dark-surface p-4 sm:p-5 rounded-xl border border-white/8">
        <div className="flex items-center justify-between">
          <LabelCaps className="text-dark-muted">Live Preview</LabelCaps>
          <span className="font-sans text-[11px] text-dark-muted/70 hidden sm:inline-block">
            Press <kbd className="font-mono text-[10px] bg-white/10 px-1 py-0.5 rounded text-dark-text">Ctrl/Cmd + Enter</kbd> to copy
          </span>
        </div>

        <div className="relative group/preview">
          <div className="w-full max-h-[360px] overflow-y-auto rounded-lg bg-dark-surface2 p-4 font-mono text-xs text-dark-text/90 leading-relaxed whitespace-pre-wrap select-text border border-white/6 shadow-inner">
            {renderLivePreview()}
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-2 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {showToast && (
              <span className="inline-flex items-center gap-1.5 font-sans text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded animate-in fade-in zoom-in-95 duration-150">
                <DrawCheck animate={true} />
                <span>Copied with values!</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {filledCount > 0 && (
              <Button
                type="button"
                variant="shell"
                size="sm"
                onClick={handleReset}
                className="text-xs text-dark-muted hover:text-dark-text"
              >
                Reset
              </Button>
            )}

            <Button
              type="button"
              variant={copied ? 'done' : 'accent'}
              size="sm"
              onClick={handleCopy}
              className="gap-2 text-xs font-semibold px-4 min-h-[38px] shadow-sm transition-all duration-150 active:scale-98"
            >
              {copied ? (
                <>
                  <DrawCheck animate={true} />
                  <span>Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Copy size={13} strokeWidth={2} />
                  <span>Copy with My Values</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
