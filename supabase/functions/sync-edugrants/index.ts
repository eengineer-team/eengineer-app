// Edugrants -> opportunities sync (Future of Eengineer.net doc, item 6:
// "train our AI to feed on the Edugrants website (engineering) news so that
// it itself can renew the opportunities on a regular basis").
//
// Scraping is done with the site owner's permission (Edugrants is a declared
// sponsor; the founder confirmed they approved it on 2026-07-24).
//
// Design choices worth knowing:
//
//  * Parsed by HEADING TEXT in DOCUMENT ORDER, not CSS classes and not DOM
//    siblings. Edugrants is a Next.js app: class names are hashed and change
//    on every redeploy, and a heading is never a sibling of its own body
//    content (both sit in separate wrapper divs). The Uzbek section headings
//    ("Tavsif", "Talablar", ...) are content and change far less often.
//
//  * BATCHED. ~256 grants, one detail fetch each, which does not fit in a
//    single invocation. Each run refreshes the listing then fetches details
//    for at most DETAIL_BUDGET slugs, never-seen first then oldest-synced.
//    Run daily and it converges in about a week, then keeps the set fresh.
//
//  * AUTH via the sync_tokens table rather than the service key: pg_cron
//    (inside Postgres) and this function (outside it) both read the same row,
//    so there is one source of truth and rotating it is a single UPDATE.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { DOMParser, type Element } from 'https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts'

const BASE = 'https://edugrants.uz'
const LIST_URL = `${BASE}/scholarships`
const DETAIL_BUDGET = 40
const MAX_LIST_PAGES = 30
const USER_AGENT = 'eengineer.net opportunity sync (+https://eengineer.net) - partner integration'

type Discipline =
  | 'Aerospace' | 'Mechanical' | 'Electrical' | 'Software' | 'Civil'
  | 'Chemical' | 'Biomedical' | 'Materials' | 'Environmental' | 'Other'

// First match wins, so the more specific disciplines are listed first.
const DISCIPLINE_RULES: [Discipline, RegExp][] = [
  ['Aerospace',     /\b(aerospace|aeronaut|rocket|satellite|space|nasa|astronom|orbital|avionic)/i],
  ['Biomedical',    /\b(biomed|bioengineer|medical device|healthcare tech|neurotech|prosthet|biotech)/i],
  ['Environmental', /\b(environment|climate|sustainab|renewable|clean energy|ocean|ecolog|carbon)/i],
  ['Software',      /\b(software|coding|programming|hackathon|computer science|app challenge|\bAI\b|artificial intelligence|machine learning|data science|cyber|robotics)/i],
  ['Electrical',    /\b(electrical|electronic|circuit|semiconductor|embedded|power systems)/i],
  ['Mechanical',    /\b(mechanical|mechatronic|manufactur|CAD|thermodynam|automotive)/i],
  ['Civil',         /\b(civil engineering|structural|architectur|construction|urban planning)/i],
  ['Chemical',      /\b(chemical engineering|chemistry|petrochem|process engineering)/i],
  ['Materials',     /\b(materials science|metallurg|polymer|nanotech|composite)/i],
]

// An engineering platform's Opportunities page should not be 200 poetry
// prizes. Import anything that reads as STEM/engineering, plus broad
// fully-funded scholarships. Tune these two lists rather than the code.
const STEM_HINT = /\b(engineer|STEM|technolog|technical|science|scientific|research|robotic|coding|programming|software|hardware|innovat|AI\b|artificial intelligence|machine learning|data|math|physics|chemistry|biology|hackathon|invention|design challenge|space|energy|climate|sustainab|computer)/i
const NON_STEM_HINT = /\b(poetry|poem|essay contest|essays|literature|literary|creative writing|photo|photograph|art exhibition|painting|drawing|music|dance|film festival|model united nations|\bMUN\b|debate|fashion)/i

interface Listed { slug: string }

interface Detail {
  slug: string
  title: string
  country: string | null
  deadlineLabel: string | null
  deadline: string | null
  description: string
  requirements: string[]
  process: string[]
  format: string | null
  applyUrl: string | null
  officialUrl: string | null
}

async function getHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { 'user-agent': USER_AGENT } })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

function textOf(el: Element | null): string {
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim()
}

interface Block { tag: string; text: string }

/** Flattens the document into text blocks in READING ORDER.
 *
 *  The first version walked nextElementSibling from each heading and returned
 *  nothing, because a heading and its body are not siblings in this markup.
 *  Rows imported with empty descriptions and null requirements while the run
 *  still reported success -- document order removes that whole class of bug. */
function toBlocks(doc: any): Block[] {
  const out: Block[] = []
  const walk = (el: Element) => {
    const text = textOf(el)
    if (!text) return
    const kids = [...el.children] as Element[]
    // Emit headings, list items and paragraphs whole even when they contain
    // inline markup; otherwise recurse until something leaf-like.
    if (kids.length === 0 || /^(H[1-6]|LI|P)$/.test(el.tagName)) {
      out.push({ tag: el.tagName, text })
      return
    }
    for (const k of kids) walk(k)
  }
  const body = doc.querySelector('body')
  if (body) walk(body as Element)
  return out
}

const isHeading = (b: Block) => /^H[1-6]$/.test(b.tag)

function sectionBlocks(blocks: Block[], heading: RegExp): Block[] {
  const start = blocks.findIndex((b) => isHeading(b) && heading.test(b.text))
  if (start < 0) return []
  const out: Block[] = []
  for (let i = start + 1; i < blocks.length; i++) {
    if (isHeading(blocks[i])) break
    out.push(blocks[i])
  }
  return out
}

function listItemsAfter(blocks: Block[], heading: RegExp): string[] {
  const section = sectionBlocks(blocks, heading)
  const lis = section.filter((b) => b.tag === 'LI').map((b) => b.text)
  const items = lis.length > 0 ? lis : section.map((b) => b.text)
  return [...new Set(items)].filter(Boolean).slice(0, 12)
}

function paragraphAfter(blocks: Block[], heading: RegExp): string {
  const texts = [...new Set(sectionBlocks(blocks, heading).map((b) => b.text))]
  return texts.filter(Boolean).join('\n\n').slice(0, 4000)
}

/** Value of a label in the "Qisqa ma'lumot" summary panel: the block right
 *  after the one whose text is the label. */
function summaryField(blocks: Block[], label: RegExp): string | null {
  const i = blocks.findIndex((b) => label.test(b.text) && b.text.length < 24)
  if (i < 0 || i + 1 >= blocks.length) return null
  const value = blocks[i + 1].text
  return value && value.length < 60 ? value : null
}

/** "Sep 30, 2026" -> ISO. Edugrants emits an epoch-zero date ("Jan 1, 1970")
 *  for grants with no real deadline set; treat that as unknown rather than
 *  importing a deadline 56 years in the past that renders as expired. */
function parseDeadline(label: string | null): string | null {
  if (!label) return null
  const ms = Date.parse(label)
  if (Number.isNaN(ms)) return null
  const d = new Date(ms)
  if (d.getUTCFullYear() <= 1970) return null
  return d.toISOString()
}

function classify(text: string): Discipline | null {
  for (const [discipline, re] of DISCIPLINE_RULES) {
    if (re.test(text)) return discipline
  }
  return null
}

function isRelevant(title: string, text: string, fullyFunded: boolean): boolean {
  // The title is the strongest signal and it is checked on its own first.
  // Previously relevance was decided over title+description together with
  // "non-STEM unless anything STEM-ish also appears", and a single generic
  // word in a long Uzbek description was enough to override the title --
  // that let "Gould Prize for Essays in English Literature" through.
  if (NON_STEM_HINT.test(title)) return false
  if (NON_STEM_HINT.test(text) && !STEM_HINT.test(title)) return false
  if (STEM_HINT.test(text)) return true
  return fullyFunded
}

async function fetchListingSlugs(): Promise<Listed[]> {
  const slugs = new Set<string>()

  // Walk until a page adds nothing new, rather than parsing the "Jami N ta
  // grant topildi" counter. The first version parsed that counter, it
  // silently matched nothing in the raw HTML (the number is split across
  // elements), totalPages stayed 1, and the sync only ever saw the first 20
  // of 256 grants while looking like it worked.
  for (let page = 1; page <= MAX_LIST_PAGES; page++) {
    const html = await getHtml(page === 1 ? LIST_URL : `${LIST_URL}?page=${page}`)
    if (!html) break

    const before = slugs.size
    for (const m of html.matchAll(/\/scholarships\/([a-z0-9][a-z0-9-]*)/gi)) {
      slugs.add(m[1])
    }
    if (slugs.size === before) break
  }
  return [...slugs].map((slug) => ({ slug }))
}

async function fetchDetail(slug: string): Promise<Detail | null> {
  const html = await getHtml(`${LIST_URL}/${slug}`)
  if (!html) return null
  const doc = new DOMParser().parseFromString(html, 'text/html')
  if (!doc) return null

  const title = textOf(doc.querySelector('h1'))
  if (!title) return null

  const blocks = toBlocks(doc)
  const bodyText = textOf(doc.querySelector('body'))

  const deadlineLabel =
    summaryField(blocks, /^Muddati$/i) ??
    bodyText.match(/Muddati:?\s*([A-Z][a-z]{2}\s+\d{1,2},\s*\d{4})/)?.[1] ??
    null

  const format =
    summaryField(blocks, /^Format$/i) ??
    bodyText.match(/\b(Onlayn|Oflayn|Gibrid)\b/)?.[1] ??
    null

  let applyUrl: string | null = null
  let officialUrl: string | null = null
  for (const a of [...doc.querySelectorAll('a[href]')] as Element[]) {
    const label = textOf(a)
    const href = a.getAttribute('href') ?? ''
    if (!/^https?:\/\//.test(href) || href.includes('edugrants.uz')) continue
    if (/ariza topshirish/i.test(label) && !applyUrl) applyUrl = href
    else if (/rasmiy veb-sayt/i.test(label) && !officialUrl) officialUrl = href
  }

  return {
    slug,
    title,
    country: summaryField(blocks, /^Davlat$/i),
    // Drop the label too when the date is the epoch-zero placeholder,
    // otherwise the card renders a literal "Jan 1, 1970" deadline.
    deadlineLabel: parseDeadline(deadlineLabel) ? deadlineLabel : null,
    deadline: parseDeadline(deadlineLabel),
    description: paragraphAfter(blocks, /^Tavsif$/i),
    requirements: listItemsAfter(blocks, /^Talablar$/i),
    process: listItemsAfter(blocks, /Ariza topshirish jarayoni/i),
    format,
    applyUrl,
    officialUrl,
  }
}

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: tokenRow } = await supabase
    .from('sync_tokens').select('token').eq('name', 'edugrants').maybeSingle()

  const presented =
    req.headers.get('x-sync-token') ??
    (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')

  if (!tokenRow?.token || presented !== tokenRow.token) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })
  }

  const listed = await fetchListingSlugs()
  if (listed.length === 0) {
    return new Response(JSON.stringify({ error: 'listing fetch failed' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    })
  }

  const { data: existing } = await supabase
    .from('opportunities')
    .select('source_key, synced_at')
    .eq('source', 'edugrants')
    .not('source_key', 'is', null)

  const syncedAt = new Map<string, string | null>(
    (existing ?? []).map((r: any) => [r.source_key as string, r.synced_at as string | null]),
  )

  // Never-seen slugs first, then the least recently synced.
  const queue = [...listed].sort((a, b) => {
    const aSeen = syncedAt.has(a.slug), bSeen = syncedAt.has(b.slug)
    if (aSeen !== bSeen) return aSeen ? 1 : -1
    return (syncedAt.get(a.slug) ?? '').localeCompare(syncedAt.get(b.slug) ?? '')
  }).slice(0, DETAIL_BUDGET)

  let imported = 0, skipped = 0, failed = 0
  const samples: string[] = []

  for (const { slug } of queue) {
    const detail = await fetchDetail(slug)
    if (!detail) { failed++; continue }

    const haystack = [detail.title, detail.description, detail.requirements.join(' ')].join(' ')
    const fullyFunded = /to'liq grant/i.test(detail.description)

    if (!isRelevant(detail.title, haystack, fullyFunded)) {
      skipped++
      // Remove anything a previous, looser filter had already let in, so
      // tightening the rules actually cleans the page up.
      await supabase.from('opportunities')
        .delete().eq('source', 'edugrants').eq('source_key', slug)
      continue
    }

    const row = {
      title: detail.title,
      organization: 'via EduGrants',
      discipline: classify(haystack),
      location: detail.country ?? '',
      remote: /onlayn/i.test(detail.format ?? ''),
      description: detail.description,
      url: `${LIST_URL}/${slug}`,
      apply_url: detail.applyUrl ?? detail.officialUrl,
      deadline: detail.deadline,
      deadline_label: detail.deadlineLabel,
      requirements: detail.requirements,
      responsibilities: detail.process,
      source: 'edugrants',
      source_key: slug,
      synced_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('opportunities')
      .upsert(row, { onConflict: 'source,source_key' })
    if (error) {
      failed++
      if (samples.length < 3) samples.push(`${slug}: ${error.message}`)
    } else {
      imported++
    }
  }

  return new Response(
    JSON.stringify({
      listed: listed.length,
      examined: queue.length,
      imported,
      skipped_not_relevant: skipped,
      failed,
      errors: samples,
    }),
    { headers: { 'content-type': 'application/json' } },
  )
})
