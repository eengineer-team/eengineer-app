import { useEffect } from 'react'

// Per-route <title>/description for the handful of public, indexable pages
// (Welcome, Help, Terms, Privacy). index.html's static tags are the
// site-wide fallback that non-JS crawlers and link-unfurlers (Slack,
// iMessage, Twitter card bots) actually see -- this hook only improves
// things for crawlers that execute JS (Google, most GEO/AI crawlers) and
// the browser tab itself. Restores the default title/description on
// unmount so navigating between routes doesn't leak a stale one.
export function useDocumentMeta(title: string, description?: string) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = title

    let meta: HTMLMetaElement | null = null
    let prevDescription: string | null = null
    if (description) {
      meta = document.querySelector('meta[name="description"]')
      if (meta) {
        prevDescription = meta.getAttribute('content')
        meta.setAttribute('content', description)
      }
    }

    return () => {
      document.title = prevTitle
      if (meta && prevDescription !== null) {
        meta.setAttribute('content', prevDescription)
      }
    }
  }, [title, description])
}
