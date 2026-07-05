// Self-rated proficiency, 1–5. Read-only dots on other people's profiles,
// clickable on your own (see ProfileDetail.tsx for the `editable` wiring).
export function SkillBar({
  name,
  proficiency,
  editable = false,
  onRate,
}: {
  name: string
  proficiency: number
  editable?: boolean
  onRate?: (level: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="font-sans text-[0.8125rem] text-dark-text">{name}</span>
      <div className="flex items-center gap-1" role={editable ? 'radiogroup' : undefined} aria-label={`${name} proficiency`}>
        {[1, 2, 3, 4, 5].map((level) => {
          const filled = level <= proficiency
          return (
            <button
              key={level}
              type="button"
              disabled={!editable}
              onClick={() => onRate?.(level)}
              aria-label={`Rate ${name} ${level} of 5`}
              aria-pressed={filled}
              className={`w-2.5 h-2.5 rounded-full transition-colors duration-150 ${
                filled ? 'bg-gold-dark' : 'bg-white/12'
              } ${editable ? 'hover:bg-gold-dark/70 cursor-pointer' : 'cursor-default'}`}
            />
          )
        })}
      </div>
    </div>
  )
}
