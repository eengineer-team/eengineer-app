export function PlaceholderSection({ label }: { label: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-1">
      <p className="font-sans text-white/70 text-sm font-medium">{label}</p>
      <p className="font-sans text-white/40 text-[0.8125rem]">Coming soon.</p>
    </div>
  )
}
