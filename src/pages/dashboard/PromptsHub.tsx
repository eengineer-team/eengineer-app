import * as React from 'react'
import { Sparkles, Search, X } from 'lucide-react'
import { LabelCaps } from '@/components/ui/label-caps'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CategoryTabs } from '@/components/prompts/CategoryTabs'
import { PromptCard } from '@/components/prompts/PromptCard'
import { FeaturedPrompt } from '@/components/prompts/FeaturedPrompt'
import { PromptDetail } from '@/components/prompts/PromptDetail'
import * as promptLabApi from '@/lib/api/prompt-lab'
import type { Prompt } from '@/lib/prompt-categories'
import { errorMessage } from '@/lib/utils'

export function PromptsHub() {
  const [prompts, setPrompts] = React.useState<Prompt[]>([])
  const [featuredPrompt, setFeaturedPrompt] = React.useState<Prompt | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [activeCategory, setActiveCategory] = React.useState<string>('all')
  const [searchQuery, setSearchQuery] = React.useState<string>('')
  const [selectedPrompt, setSelectedPrompt] = React.useState<Prompt | null>(null)

  // Fetch prompts and featured prompt
  React.useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    Promise.all([
      promptLabApi.fetchPrompts(),
      promptLabApi.fetchFeaturedPrompt(),
    ])
      .then(([allPrompts, featured]) => {
        if (!isMounted) return
        setPrompts(allPrompts)
        setFeaturedPrompt(featured)
        setLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        setError(errorMessage(err, 'Failed to load Prompt Lab templates.'))
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Calculate category counts
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: prompts.length }
    prompts.forEach((p) => {
      const slug = p.category?.slug || (p as unknown as { category_id: string }).category_id
      if (slug) {
        counts[slug] = (counts[slug] || 0) + 1
      }
    })
    return counts
  }, [prompts])

  // Filter prompts based on active tab and search query
  const filteredPrompts = React.useMemo(() => {
    let result = prompts

    if (activeCategory !== 'all') {
      result = result.filter(
        (p) =>
          p.category?.slug === activeCategory ||
          (p as unknown as { category_id: string }).category_id === activeCategory
      )
    }

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.prompt_text.toLowerCase().includes(q) ||
          p.why_it_works?.toLowerCase().includes(q) ||
          p.tools.some((tool) => tool.toLowerCase().includes(q))
      )
    }

    return result
  }, [prompts, activeCategory, searchQuery])

  const showFeatured =
    Boolean(featuredPrompt) &&
    searchQuery.trim().length === 0 &&
    (activeCategory === 'all' ||
      featuredPrompt?.category?.slug === activeCategory ||
      (featuredPrompt as unknown as { category_id: string })?.category_id === activeCategory)

  return (
    <div className="flex-1 w-full px-4 md:px-8 py-6 md:py-8 max-w-[900px] mx-auto">
      {/* Eyebrow */}
      <LabelCaps className="text-gold-dark mb-3 block">Prompt Lab</LabelCaps>

      {/* Title */}
      <div className="flex items-center gap-2.5 mb-1">
        <Sparkles size={20} className="text-gold-dark" />
        <h1 className="font-display text-xl sm:text-2xl font-bold text-dark-text">
          Prompt Lab
        </h1>
      </div>

      {/* Subtitle */}
      <p className="font-sans text-[0.8125rem] sm:text-sm text-dark-muted mb-6">
        Staff-level prompts for every engineering task. Copy, paste, ship.
      </p>

      {/* Search & Category Filter Section */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Search Input Bar */}
        <div className="relative w-full">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-muted/60 pointer-events-none"
          />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prompts by keyword, tool (Claude, Cursor, GPT-4o), or failure scenario…"
            className="pl-10 pr-9 bg-white/5 border-white/10 text-dark-text placeholder:text-dark-muted/40 focus:border-gold-dark/50 focus:bg-white/[0.08] transition-all h-11 text-sm rounded-xl"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-muted hover:text-dark-text p-1 rounded transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <CategoryTabs
          activeSlug={activeCategory}
          onSelectCategory={setActiveCategory}
          counts={categoryCounts}
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-sans text-xs mb-6">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-dark-muted">
          <div className="w-6 h-6 border-2 border-gold-dark/40 border-t-gold-dark rounded-full animate-spin" />
          <p className="font-sans text-xs">Loading prompts bank…</p>
        </div>
      )}

      {!loading && !error && (
        <div className="flex flex-col gap-6">
          {/* Featured Prompt of the Day Banner */}
          {showFeatured && featuredPrompt && (
            <FeaturedPrompt
              prompt={featuredPrompt}
              onOpen={(p) => setSelectedPrompt(p)}
              className="mb-2"
            />
          )}

          {/* Prompts Section Header */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <LabelCaps className="text-dark-muted">
                {activeCategory === 'all' ? 'All Templates' : 'Filtered Templates'}
              </LabelCaps>
              <span className="font-mono text-xs text-dark-muted/70">
                ({filteredPrompts.length})
              </span>
            </div>

            {(searchQuery || activeCategory !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setActiveCategory('all')
                }}
                className="font-sans text-xs text-gold-dark hover:underline"
              >
                Reset filters
              </button>
            )}
          </div>

          {/* Prompts Grid */}
          {filteredPrompts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPrompts.map((prompt) => (
                <PromptCard
                  key={prompt.id || prompt.slug}
                  prompt={prompt}
                  onSelect={(p) => setSelectedPrompt(p)}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-dark-surface rounded-2xl border border-white/6">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-dark-muted mb-3">
                <Search size={22} />
              </div>
              <h3 className="font-display text-base font-semibold text-dark-text mb-1">
                No prompts found
              </h3>
              <p className="font-sans text-xs text-dark-muted max-w-sm mb-4">
                No templates matched your search query{' '}
                {searchQuery && <span className="text-gold-dark">"{searchQuery}"</span>} in this
                category.
              </p>
              <Button
                variant="shell"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setActiveCategory('all')
                }}
                className="text-xs"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Selected Prompt Detail / Modal */}
      <PromptDetail
        prompt={selectedPrompt}
        open={Boolean(selectedPrompt)}
        onClose={() => setSelectedPrompt(null)}
      />
    </div>
  )
}
export default PromptsHub
