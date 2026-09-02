import { BookMarked } from 'lucide-react'
import { cn } from '../../lib/shadcn/utils'

// Small inline badge showing which playbook version produced a draft.
export function VersionBadge({
  versionNumber,
  playbookName,
  className,
}: {
  versionNumber: number | null | undefined
  playbookName?: string | null
  className?: string
}) {
  const legacy = versionNumber == null
  return (
    <span
      title={legacy ? 'No playbook version (legacy draft)' : `${playbookName ?? 'Playbook'} v${versionNumber}`}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
        legacy
          ? 'border-border bg-muted text-muted-foreground'
          : 'border-primary/30 bg-primary/10 text-primary',
        className
      )}
    >
      <BookMarked className="h-3 w-3" />
      {legacy ? 'Unversioned' : `v${versionNumber}`}
    </span>
  )
}
