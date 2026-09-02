import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FlaskConical, Loader2, Trophy, Square, TrendingUp, CheckCircle2 } from 'lucide-react'
import { useConsole } from '../context/ConsoleContext'
import { useGetExperimentResults, usePromoteVariant, useStopExperiment } from '../hooks/backend/console'
import {
  Experiment, ExperimentVariantResult, ExperimentComparison, EXPERIMENT_STATUS_META, formatPct,
} from '../lib/console/types'
import { Button } from '../lib/shadcn/button'
import { Badge } from '../lib/shadcn/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../lib/shadcn/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../lib/shadcn/alert-dialog'
import { toast } from '../lib/shadcn/sonner'

type Results = {
  experiment: Experiment & { playbook_name: string }
  threshold: number
  variants: ExperimentVariantResult[]
  comparison: ExperimentComparison | null
}

export default function ExperimentResultsPage() {
  const { id } = useParams()
  const expId = Number(id)
  const navigate = useNavigate()
  const { role, actor } = useConsole()
  const canEdit = role === 'manager' || role === 'admin'

  const { data, loading, trigger } = useGetExperimentResults()
  const promote = usePromoteVariant()
  const stop = useStopExperiment()
  const [promoteTarget, setPromoteTarget] = useState<ExperimentVariantResult | null>(null)

  const load = useCallback(() => {
    if (Number.isFinite(expId)) void trigger({ experimentId: expId }, { skipCache: true })
  }, [trigger, expId])
  useEffect(() => { load() }, [load])

  const r = data as Results | undefined

  if (loading && !r) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading results…
      </div>
    )
  }
  if (!r) return null

  const { experiment, threshold, variants, comparison } = r
  const isActive = experiment.status === 'running' || experiment.status === 'stopped'

  const confirmPromote = async () => {
    if (!promoteTarget) return
    try {
      await promote.trigger({ experimentId: expId, variantId: promoteTarget.id, actor, role }).result
      toast.success(`Promoted Variant ${promoteTarget.label}`, { description: `v${promoteTarget.version_number} is now the active version; experiment completed.` })
      setPromoteTarget(null)
      load()
    } catch (e) {
      toast.error('Could not promote', { description: e instanceof Error ? e.message : String(e) })
    }
  }

  const doStop = async () => {
    try {
      await stop.trigger({ experimentId: expId, actor, role }).result
      toast.success('Experiment stopped')
      load()
    } catch (e) {
      toast.error('Could not stop', { description: e instanceof Error ? e.message : String(e) })
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <Button variant="ghost" onClick={() => navigate(`/playbooks/${experiment.playbook_id}`)} className="mb-4 gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to playbook
      </Button>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <FlaskConical className="h-6 w-6 text-primary" /> {experiment.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{experiment.playbook_name}</p>
          {experiment.hypothesis && <p className="mt-2 max-w-2xl text-sm text-body-foreground">{experiment.hypothesis}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={EXPERIMENT_STATUS_META[experiment.status]?.variant ?? 'outline'}>
            {EXPERIMENT_STATUS_META[experiment.status]?.label ?? experiment.status}
          </Badge>
          {canEdit && experiment.status === 'running' && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={doStop} disabled={stop.loading}>
              <Square className="h-3.5 w-3.5" /> Stop
            </Button>
          )}
        </div>
      </div>

      {/* Summary banner */}
      {comparison && (
        <div className={`mb-6 flex items-start gap-2.5 rounded-lg border p-4 ${comparison.significant ? 'border-success/40 bg-success/10' : 'border-primary/20 bg-primary/5'}`}>
          {comparison.significant ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> : <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
          <div>
            <p className="text-sm font-medium text-foreground">{comparison.summary}</p>
            {comparison.confidence != null && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Two-proportion z-test · z = {comparison.zScore?.toFixed(2)} · minimum {threshold} sends per variant
              </p>
            )}
          </div>
        </div>
      )}
      {!comparison && (
        <div className="mb-6 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          Reply-rate comparison will appear once both variants have outcome data.
        </div>
      )}

      {/* Per-variant table */}
      <div className="rounded-lg border border-border bg-card shadow-retool-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Variant</TableHead>
              <TableHead className="text-right">Drafts</TableHead>
              <TableHead className="text-right">Approval (no edits)</TableHead>
              <TableHead className="text-right">Override rate</TableHead>
              <TableHead className="text-right">Sent</TableHead>
              <TableHead className="text-right">Reply rate</TableHead>
              {canEdit && isActive && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((v) => {
              const isWinner = comparison?.significant && comparison.leaderLabel === v.label
              return (
                <TableRow key={v.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="w-7 justify-center">{v.label}</Badge>
                      <span className="text-sm text-muted-foreground">v{v.version_number}</span>
                      {isWinner && <span className="inline-flex items-center gap-1 text-xs font-medium text-success"><Trophy className="h-3.5 w-3.5" /> leader</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{v.drafts}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatPct(v.approval_no_edit_rate, 1)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatPct(v.override_rate, 1)}</TableCell>
                  <TableCell className="text-right tabular-nums">{v.sent}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {v.reply_pending
                      ? <span className="text-muted-foreground">pending</span>
                      : <span className="text-foreground">{formatPct(v.reply_rate, 1)}</span>}
                  </TableCell>
                  {canEdit && isActive && (
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setPromoteTarget(v)}>
                        <Trophy className="h-3.5 w-3.5" /> Promote
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Reply rate = replies ÷ sent, from downstream outcome events. Missing data shows as “pending,” never counted as zero replies.
      </p>

      <AlertDialog open={promoteTarget != null} onOpenChange={(o) => !o && setPromoteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promote Variant {promoteTarget?.label} (v{promoteTarget?.version_number})?</AlertDialogTitle>
            <AlertDialogDescription>
              This activates v{promoteTarget?.version_number} as the playbook&apos;s active version (same as a normal activation)
              and marks this experiment completed. New drafts will use it going forward.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPromote}>Promote & complete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
