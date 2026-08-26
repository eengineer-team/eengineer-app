import { supabase } from '@/lib/supabase'
import { errorMessage } from '@/lib/utils'
import type {
  Prompt,
  PromptCategory,
  PromptSubmission,
} from '@/lib/prompt-categories'
import { ALL_CATEGORIES } from '@/lib/prompt-categories'
import { SEED_PROMPTS } from '@/lib/prompt-seed-data'

export async function currentUid(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id ?? null
}

/**
 * Fetches all categories, ordered by sort_order.
 */
export async function fetchCategories(): Promise<PromptCategory[]> {
  try {
    const { data, error } = await supabase
      .from('prompt_categories')
      .select('*')
      .order('sort_order')

    if (error) {
      console.warn('Using default categories fallback:', error.message)
      return ALL_CATEGORIES
    }

    if (data && data.length > 0) {
      return data as unknown as PromptCategory[]
    }
  } catch (err) {
    console.warn('Failed to query prompt_categories from supabase:', errorMessage(err, ''))
  }

  return ALL_CATEGORIES
}

/**
 * Fetches prompts with their joined category and variables.
 * Can filter by categorySlug and/or searchQuery.
 */
export async function fetchPrompts(
  categorySlug?: string,
  searchQuery?: string
): Promise<Prompt[]> {
  try {
    let query = supabase
      .from('prompts')
      .select(
        `
        *,
        category:prompt_categories(*),
        variables:prompt_variables(*)
      `
      )
      .eq('is_active', true)
      .order('sort_order')

    const { data, error } = await query

    if (!error && data && data.length > 0) {
      let results = data as unknown as Prompt[]

      // Filter by category if requested
      if (categorySlug && categorySlug !== 'all') {
        results = results.filter(
          (p) => p.category?.slug === categorySlug || (p as unknown as { category_id: string }).category_id === categorySlug
        )
      }

      // Filter by search query if provided
      if (searchQuery && searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim()
        results = results.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.prompt_text.toLowerCase().includes(q) ||
            p.why_it_works?.toLowerCase().includes(q) ||
            p.tools.some((tool) => tool.toLowerCase().includes(q))
        )
      }

      return results
    }
  } catch (err) {
    console.warn('Failed to query prompts from Supabase:', errorMessage(err, 'Falling back to seed data'))
  }

  // Fallback to rich seed dataset
  let results = [...SEED_PROMPTS]

  if (categorySlug && categorySlug !== 'all') {
    results = results.filter(
      (p) => p.category?.slug === categorySlug || p.category_id === categorySlug
    )
  }

  if (searchQuery && searchQuery.trim().length > 0) {
    const q = searchQuery.toLowerCase().trim()
    results = results.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.prompt_text.toLowerCase().includes(q) ||
        p.why_it_works?.toLowerCase().includes(q) ||
        p.tools.some((tool) => tool.toLowerCase().includes(q))
    )
  }

  return results
}

/**
 * Fetches a single prompt by its unique slug.
 */
export async function fetchPromptBySlug(slug: string): Promise<Prompt | null> {
  try {
    const { data, error } = await supabase
      .from('prompts')
      .select(
        `
        *,
        category:prompt_categories(*),
        variables:prompt_variables(*)
      `
      )
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()

    if (!error && data) {
      return data as unknown as Prompt
    }
  } catch (err) {
    console.warn('Failed to query prompt by slug from Supabase:', errorMessage(err, 'Falling back to seed data'))
  }

  return SEED_PROMPTS.find((p) => p.slug === slug) ?? null
}

/**
 * Fetches the featured "Prompt of the Day".
 */
export async function fetchFeaturedPrompt(): Promise<Prompt | null> {
  const today = new Date().toISOString().split('T')[0]

  try {
    // 1. Try finding a prompt specifically featured for today's date
    const { data: todayFeatured, error: todayErr } = await supabase
      .from('prompts')
      .select(
        `
        *,
        category:prompt_categories(*),
        variables:prompt_variables(*)
      `
      )
      .eq('is_active', true)
      .eq('featured_date', today)
      .maybeSingle()

    if (!todayErr && todayFeatured) {
      return todayFeatured as unknown as Prompt
    }

    // 2. Otherwise pick the top featurable prompt
    const { data: featurable, error: featErr } = await supabase
      .from('prompts')
      .select(
        `
        *,
        category:prompt_categories(*),
        variables:prompt_variables(*)
      `
      )
      .eq('is_active', true)
      .eq('is_featurable', true)
      .order('sort_order')
      .limit(1)
      .maybeSingle()

    if (!featErr && featurable) {
      return featurable as unknown as Prompt
    }
  } catch (err) {
    console.warn('Failed to query featured prompt from Supabase:', errorMessage(err, 'Falling back to seed data'))
  }

  // Fallback: pick the first featurable seed prompt (or based on day of month)
  const featurableSeed = SEED_PROMPTS.filter((p) => p.is_featurable)
  if (featurableSeed.length === 0) return SEED_PROMPTS[0] ?? null

  const dayIndex = new Date().getDate() % featurableSeed.length
  return featurableSeed[dayIndex] ?? featurableSeed[0]
}

/**
 * Records prompt usage analytics (view or copy action).
 */
export async function recordPromptUsage(
  promptId: string,
  action: 'copy' | 'view'
): Promise<void> {
  try {
    const uid = await currentUid()
    // Avoid erroring on mock IDs that don't match UUID format
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      promptId
    )

    if (!isUuid) return

    await supabase.from('prompt_usage_stats').insert({
      prompt_id: promptId,
      profile_id: uid,
      action,
    })
  } catch (err) {
    // Non-blocking telemetry
    console.debug('Prompt usage record skipped:', errorMessage(err, ''))
  }
}

/**
 * Submits a community prompt for review.
 */
export async function submitPrompt(
  submission: Omit<PromptSubmission, 'id' | 'status' | 'created_at'>
): Promise<void> {
  const uid = await currentUid()
  if (!uid) {
    throw new Error('You must be signed in to submit a prompt.')
  }

  const { error } = await supabase.from('prompt_submissions').insert({
    profile_id: uid,
    title: submission.title,
    category_slug: submission.category_slug,
    prompt_text: submission.prompt_text,
    variables: (submission.variables ? JSON.parse(JSON.stringify(submission.variables)) : []) as any,
    status: 'pending',
  })

  if (error) {
    throw new Error(errorMessage(error, 'Failed to submit prompt for review.'))
  }
}
