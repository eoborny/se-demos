import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ChevronRight, Mail, Linkedin, Phone } from 'lucide-react'
import { Draft, PRIORITY_META, relativeTime } from '../../lib/console/types'
import { Badge } from '../../lib/shadcn/badge'
import { StatusBadge } from './StatusBadge'
import { VersionBadge } from './VersionBadge'
import { cn } from '../../lib/shadcn/utils'

const TYPE_ICON: Record<string, typeof Mail> = {
  Email: Mail,
  LinkedIn: Linkedin,
  'Call Script': Phone,
}

function ConfidenceDot({ value }: { value: number }) {
  const color = value >= 0.85 ? 'bg-success' : value >= 0.7 ? 'bg-warning' : 'bg-destructive'
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={cn('h-2 w-2 rounded-full', color)} />
      {Math.round(value * 100)}% conf.
    </span>
  )
}

export function DraftCard({ draft }: { draft: Draft }) {
  const navigate = useNavigate()
  const Icon = TYPE_ICON[draft.outreach_type] ?? Mail
  const preview = (draft.subject ?? draft.current_content).slice(0, 120)

  return (
    <button
      onClick={() => navigate(`/draft/${draft.id}`)}
      className="group flex w-full items-center gap-4 rounded-lg border border-border bg-card p-4 text-left shadow-retool-sm transition-colors hover:border-primary/40 hover:bg-accent/40"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold text-foreground">{draft.account_name}</span>
          <Badge variant="outline" className="shrink-0 text-[10px]">{draft.account_tier}</Badge>
          {draft.sensitive && (
            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-warning">
              <AlertTriangle className="h-3.5 w-3.5" /> Sensitive
            </span>
          )}
        </div>
        <div className="truncate text-sm text-muted-foreground">
          {draft.contact_name}{draft.contact_title ? ` · ${draft.contact_title}` : ''} — {preview}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-xs text-muted-foreground">{draft.outreach_type}</span>
          {draft.sequence_step && <span className="text-xs text-muted-foreground">· {draft.sequence_step}</span>}
          <span className="text-xs text-muted-foreground">· {draft.rep_name}</span>
          <span className="text-xs text-muted-foreground">· {relativeTime(draft.created_at)}</span>
          <ConfidenceDot value={draft.confidence} />
          {!draft.experiment_id && <VersionBadge versionNumber={draft.playbook_version_number} playbookName={draft.playbook_name} />}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <StatusBadge status={draft.status} />
        <Badge variant={PRIORITY_META[draft.priority] ?? 'secondary'} className="text-[10px]">
          {draft.priority}
        </Badge>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}
