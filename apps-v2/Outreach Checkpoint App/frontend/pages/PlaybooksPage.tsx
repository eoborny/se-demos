import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookMarked, ChevronRight, Loader2, GitBranch, FileText } from 'lucide-react'
import { useGetPlaybooks } from '../hooks/backend/console'
import { Playbook, formatPct } from '../lib/console/types'
import { Badge } from '../lib/shadcn/badge'
import { cn } from '../lib/shadcn/utils'

function rateTone(rate: number | null): string {
  if (rate == null) return 'text-muted-foreground'
  if (rate <= 0.25) return 'text-success'
  if (rate <= 0.4) return 'text-warning'
  return 'text-destructive'
}

export default function PlaybooksPage() {
  const navigate = useNavigate()
  const { data, loading, trigger } = useGetPlaybooks()

  const load = useCallback(() => { void trigger({}, { skipCache: true }) }, [trigger])
  useEffect(() => { load() }, [load])

  const playbooks = (data as Playbook[] | undefined) ?? []

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
          <BookMarked className="h-6 w-6 text-primary" /> Playbooks
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Version-controlled outreach prompts. Track whether each change actually reduced rep overrides.
        </p>
      </div>

      {loading && playbooks.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading playbooks…
        </div>
      ) : (
        <div className="space-y-3">
          {playbooks.map((pb) => (
            <button
              key={pb.id}
              onClick={() => navigate(`/playbooks/${pb.id}`)}
              className="group flex w-full items-center gap-4 rounded-lg border border-border bg-card p-4 text-left shadow-retool-sm transition-colors hover:border-primary/40 hover:bg-accent/40"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <BookMarked className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold text-foreground">{pb.name}</span>
                  <Badge variant="outline" className="shrink-0 text-[10px]">{pb.outreach_type}</Badge>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><GitBranch className="h-3.5 w-3.5" /> {pb.version_count} versions</span>
                  <span>{pb.active_version_number != null ? `Active: v${pb.active_version_number}` : 'No active version'}</span>
                  <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> {pb.total_drafts} drafts</span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className={cn('text-lg font-bold', rateTone(pb.override_rate))}>{formatPct(pb.override_rate)}</div>
                <div className="text-[11px] text-muted-foreground">override rate</div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
          {playbooks.length === 0 && (
            <div className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
              No playbooks yet.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
