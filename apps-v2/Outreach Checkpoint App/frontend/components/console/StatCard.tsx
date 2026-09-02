import { ReactNode } from 'react'
import { cn } from '../../lib/shadcn/utils'

export function StatCard({
  label,
  value,
  icon,
  accent,
  hint,
}: {
  label: string
  value: ReactNode
  icon?: ReactNode
  accent?: 'primary' | 'warning' | 'success' | 'destructive' | 'muted'
  hint?: string
}) {
  const accentClass =
    accent === 'primary'
      ? 'text-primary'
      : accent === 'warning'
        ? 'text-warning'
        : accent === 'success'
          ? 'text-success'
          : accent === 'destructive'
            ? 'text-destructive'
            : 'text-foreground'

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-retool-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div className={cn('mt-2 text-2xl font-bold', accentClass)}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  )
}
