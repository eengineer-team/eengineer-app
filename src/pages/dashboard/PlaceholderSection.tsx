export function PlaceholderSection({ label }: { label: string }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <p className="font-sans text-white/40 text-sm">{label} — coming in a later phase</p>
    </div>
  )
}
