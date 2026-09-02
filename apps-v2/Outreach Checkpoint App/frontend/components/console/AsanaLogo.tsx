// Official Asana logo: coral "worklings" mark (three dots) + asana wordmark.
// The mark uses the brand coral (#FF584A) in both themes; the wordmark uses the
// current foreground colour so it stays legible in light and dark mode.
export function AsanaLogo({
  size = 26,
  showWordmark = true,
}: {
  size?: number
  showWordmark?: boolean
}) {
  return (
    <div className="flex items-center" style={{ gap: size * 0.34 }}>
      <svg width={size} height={size} viewBox="0 0 100 100" aria-label="Asana" role="img">
        <circle cx="50" cy="26" r="18" fill="#FF584A" />
        <circle cx="25" cy="72" r="18" fill="#FF584A" />
        <circle cx="75" cy="72" r="18" fill="#FF584A" />
      </svg>
      {showWordmark && (
        <span
          className="font-bold lowercase text-foreground"
          style={{ fontSize: size * 0.82, letterSpacing: '-0.02em', lineHeight: 1 }}
        >
          asana
        </span>
      )}
    </div>
  )
}
