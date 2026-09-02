import { AsanaLogo } from './AsanaLogo'

// Brand lockup for the console: the Asana logo paired with the internal
// product name, per the "Asana-branded, no vendor branding" guideline.
export function Brand({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex w-full justify-center">
        <AsanaLogo size={26} showWordmark={false} />
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2.5">
      <AsanaLogo size={24} />
      <span className="h-4 w-px bg-border" />
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight text-foreground">Outreach Review</div>
        <div className="text-[11px] font-medium text-muted-foreground">Console</div>
      </div>
    </div>
  )
}
