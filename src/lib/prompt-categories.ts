export type PromptCategorySlug = 'chatbot' | 'agent' | 'cowork' | 'error-clinic' | 'design'

export type PromptDifficulty = 'starter' | 'intermediate' | 'advanced'

export type PromptAuthorType = 'team' | 'community'

export interface PromptCategory {
  id: string
  slug: PromptCategorySlug
  label: string
  icon_emoji: string | null
  sort_order: number
  is_visible: boolean
  created_at?: string
}

export interface PromptVariable {
  id?: string
  prompt_id?: string
  name: string
  description: string
  is_multiline: boolean
  sort_order?: number
}

export interface Prompt {
  id: string
  category_id: string
  slug: string
  title: string
  difficulty: PromptDifficulty
  tools: string[]
  prompt_text: string
  when_to_use?: string | null
  why_it_works: string | null
  pro_tips: string | null
  sort_order: number
  is_active: boolean
  is_featurable: boolean
  featured_date: string | null
  published_at: string
  author_type: PromptAuthorType
  author_name: string | null
  pack_slug: string | null
  created_at: string
  category?: PromptCategory
  variables?: PromptVariable[]
}

export interface PromptSubmission {
  id?: string
  profile_id?: string
  title: string
  category_slug: string
  prompt_text: string
  variables?: PromptVariable[] | Record<string, unknown>
  status?: 'pending' | 'approved' | 'rejected'
  reviewer_notes?: string | null
  created_at?: string
}

export const ALL_CATEGORIES: PromptCategory[] = [
  {
    id: 'cat-chatbot',
    slug: 'chatbot',
    label: 'AI Chatbot',
    icon_emoji: '🤖',
    sort_order: 1,
    is_visible: true,
  },
  {
    id: 'cat-agent',
    slug: 'agent',
    label: 'AI Agent',
    icon_emoji: '🕹️',
    sort_order: 2,
    is_visible: true,
  },
  {
    id: 'cat-cowork',
    slug: 'cowork',
    label: 'Cowork AI',
    icon_emoji: '🤝',
    sort_order: 3,
    is_visible: true,
  },
  {
    id: 'cat-error-clinic',
    slug: 'error-clinic',
    label: 'Error Clinic',
    icon_emoji: '🔧',
    sort_order: 4,
    is_visible: true,
  },
  {
    id: 'cat-design',
    slug: 'design',
    label: 'Design AI',
    icon_emoji: '🎨',
    sort_order: 5,
    is_visible: false, // Design tab is hidden per specification
  },
]

// Visible categories excluding 'design'
export const VISIBLE_CATEGORIES: PromptCategory[] = ALL_CATEGORIES.filter(
  (c) => c.is_visible && c.slug !== 'design'
)

export interface CategoryTabItem {
  slug: 'all' | PromptCategorySlug
  label: string
  icon_emoji?: string | null
}

export const CATEGORY_TABS: CategoryTabItem[] = [
  { slug: 'all', label: 'All' },
  ...VISIBLE_CATEGORIES.map((c) => ({
    slug: c.slug,
    label: c.label,
    icon_emoji: c.icon_emoji,
  })),
]

/**
 * Checks if a prompt was published within the last 7 days.
 */
export function isPromptNew(publishedAt: string | null | undefined): boolean {
  if (!publishedAt) return false
  const publishedTime = new Date(publishedAt).getTime()
  if (isNaN(publishedTime)) return false
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
  return Date.now() - publishedTime <= sevenDaysMs
}

/**
 * Extracts variable names from a template string containing `{{VAR_NAME}}`
 */
export function extractVariableTokens(template: string): string[] {
  const regex = /\{\{([A-Za-z0-9_]+)\}\}/g
  const tokens: string[] = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(template)) !== null) {
    if (!tokens.includes(match[1])) {
      tokens.push(match[1])
    }
  }
  return tokens
}

/**
 * Replaces `{{VAR_NAME}}` tokens with provided values.
 * If a value is missing or empty, keeps the original token or fallback.
 */
export function interpolatePrompt(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{([A-Za-z0-9_]+)\}\}/g, (match, tokenName) => {
    const val = values[tokenName]
    return val !== undefined && val.trim() !== '' ? val : match
  })
}
