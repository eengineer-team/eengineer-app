// Custom checkmark (not lucide's <Check>) so the stroke itself can draw in —
// pathLength=1000 normalizes this path to the same units the shared `draw`
// keyframe (tailwind.config.js) already animates over, so a 24x24 glyph
// reuses it without a bespoke dasharray. Shared by both webinar Register
// spots (Webinars.tsx and DashboardHome's "Next webinar" card) so the same
// confirmation reads identically in either place.
export function DrawCheck({ animate }: { animate: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 12l6 6L20 6"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1000}
        strokeDasharray={1000}
        className={animate ? 'animate-draw-fast motion-reduce:animate-none' : undefined}
      />
    </svg>
  )
}
