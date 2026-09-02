import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, BookMarked, Plus, Loader2, TrendingDown, TrendingUp, Minus, Play, Sparkles, CheckCircle2,
} from 'lucide-react'
import {
  useGetPlaybookDetail, useCreatePlaybookVersion, useActivatePlaybookVersion, useCreateDraftFromPlaybook,
} from '../hooks/backend/console'
import { useConsole } from '../context/ConsoleContext'
import { VersionAnalytics, Playbook, VERSION_STATUS_META, formatPct, relativeTime } from '../lib/console/types'
import { Button } from '../lib/shadcn/button'
import { Badge } from '../lib/shadcn/badge'
import { Textarea } from '../lib/shadcn/textarea'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../lib/shadcn/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '../lib/shadcn/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../lib/shadcn/alert-dialog'
import { toast } from '../lib/shadcn/sonner'
import { ExperimentsSection } from '../components/console/ExperimentsSection'

type Detail = { playbook: Playbook; threshold: number; versions: VersionAnalytics[] }

function DeltaCell({ v, threshold }: { v: VersionAnalytics; threshold: number }) {
  if (v.delta.prev_version_number == null) return <span className="text-muted-foreground">—</span>
  if (!v.delta.enough_data) {
    return <span className="text-xs text-muted-foreground">Not enough data yet (need {threshold})</span>
  }
  if (v.delta.value == null) return <span className="text-muted-foreground">—</span>
  const improved = v.delta.value > 0
  const flat = Math.abs(v.delta.value) < 0.005
  const Icon = flat ? Minus : improved ? TrendingDown : TrendingUp
  const tone = flat ? 'text-muted-foreground' : improved ? 'text-success' : 'text-destructive'
  const verb = improved ? 'cut' : 'raised'
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${tone}`}>
      <Icon className="h-4 w-4" />
      {flat ? 'No change' : `${verb} ${formatPct(Math.abs(v.delta.value))} vs v${v.delta.prev_version_number}`}
    </span>
  )
}

export default function PlaybookDetailPage() {
  const { id } = useParams()
  const pid = Number(id)
  const navigate = useNavigate()
  const { role, actor } = useConsole()
  const canEdit = role === 'manager' || role === 'admin'

  const { data, loading, trigger } = useGetPlaybookDetail()
  const createVersion = useCreatePlaybookVersion()
  const activate = useActivatePlaybookVersion()
  const createDraft = useCreateDraftFromPlaybook()

  const [newOpen, setNewOpen] = useState(false)
  const [promptText, setPromptText] = useState('')
  const [changeNotes, setChangeNotes] = useState('')
  const [activateTarget, setActivateTarget] = useState<VersionAnalytics | null>(null)

  const load = useCallback(() => {
    if (Number.isFinite(pid)) void trigger({ playbookId: pid }, { skipCache: true })
  }, [trigger, pid])
  useEffect(() => { load() }, [load])

  const detail = data as Detail | undefined

  if (loading && !detail) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading playbook…
      </div>
    )
  }
  if (!detail) return null

  const { playbook, threshold, versions } = detail
  const activeVersion = versions.find((v) => v.status === 'active')
  const descVersions = [...versions].sort((a, b) => b.version_number - a.version_number)

  const openNew = () => {
    setPromptText(activeVersion?.prompt_text ?? '')
    setChangeNotes('')
    setNewOpen(true)
  }

  const submitNew = async () => {
    if (!promptText.trim()) { toast.error('Prompt text is required'); return }
    if (!changeNotes.trim()) { toast.error('Change notes are required'); return }
    try {
      const res = (await createVersion.trigger({ playbookId: pid, promptText, changeNotes, actor, role }).result) as { version_number: number }
      toast.success(`Created v${res.version_number} (draft)`, { description: 'Activate it to route new drafts through this version.' })
      setNewOpen(false)
      load()
    } catch (e) {
      toast.error('Could not create version', { description: e instanceof Error ? e.message : String(e) })
    }
  }

  const confirmActivate = async () => {
    if (!activateTarget) return
    try {
      await activate.trigger({ playbookId: pid, versionId: activateTarget.id, actor, role }).result
      const wasRetired = activateTarget.status === 'retired'
      toast.success(`v${activateTarget.version_number} is now active`, {
        description: wasRetired ? 'Rolled back to a previous version.' : 'New drafts will use this version.',
      })
      setActivateTarget(null)
      load()
    } catch (e) {
      toast.error('Could not activate version', { description: e instanceof Error ? e.message : String(e) })
    }
  }

  const simulateDraft = async () => {
    try {
      const res = (await createDraft.trigger({ playbookId: pid, actor, role }).result) as { id: number; version_number: number }
      toast.success(`New draft created from v${res.version_number}`, { description: 'Tagged with the active version.' })
      navigate(`/draft/${res.id}`)
    } catch (e) {
      toast.error('Could not create draft', { description: e instanceof Error ? e.message : String(e) })
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <Button variant="ghost" onClick={() => navigate('/playbooks')} className="mb-4 gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to playbooks
      </Button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <BookMarked className="h-6 w-6 text-primary" /> {playbook.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {playbook.outreach_type} · created by {playbook.created_by} · {versions.length} versions
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            {activeVersion && (
              <Button variant="outline" className="gap-2" onClick={simulateDraft} disabled={createDraft.loading}>
                {createDraft.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Simulate draft
              </Button>
            )}
            <Button className="gap-2" onClick={openNew}><Plus className="h-4 w-4" /> New version</Button>
          </div>
        )}
      </div>

      {/* Comparison table */}
      <div className="mb-8 rounded-lg border border-border bg-card shadow-retool-sm">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
          Override-rate comparison
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Drafts</TableHead>
              <TableHead className="text-right">Override rate</TableHead>
              <TableHead>Δ vs previous</TableHead>
              <TableHead>Top reasons</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {descVersions.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-semibold text-foreground">v{v.version_number}</TableCell>
                <TableCell><Badge variant={VERSION_STATUS_META[v.status]?.variant ?? 'outline'}>{VERSION_STATUS_META[v.status]?.label ?? v.status}</Badge></TableCell>
                <TableCell className="text-right tabular-nums">{v.draft_count}</TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {v.override_rate == null ? <span className="text-muted-foreground">—</span> : formatPct(v.override_rate, 1)}
                </TableCell>
                <TableCell><DeltaCell v={v} threshold={threshold} /></TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {v.reasons.length === 0 ? '—' : v.reasons.slice(0, 3).map((r) => `${r.reason} (${r.count})`).join(', ')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Version history */}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Version history</h2>
      <div className="space-y-3">
        {descVersions.map((v) => (
          <div key={v.id} className="rounded-lg border border-border bg-card p-4 shadow-retool-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-foreground">v{v.version_number}</span>
                <Badge variant={VERSION_STATUS_META[v.status]?.variant ?? 'outline'}>{VERSION_STATUS_META[v.status]?.label ?? v.status}</Badge>
                {v.status === 'active' && <span className="inline-flex items-center gap-1 text-xs text-success"><CheckCircle2 className="h-3.5 w-3.5" /> Live</span>}
              </div>
              {canEdit && v.status !== 'active' && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setActivateTarget(v)}>
                  <Play className="h-3.5 w-3.5" /> {v.status === 'retired' ? 'Reactivate (rollback)' : 'Activate'}
                </Button>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              by {v.created_by} · {relativeTime(v.created_at)} · {v.draft_count} drafts · override rate {formatPct(v.override_rate, 1)}
            </p>
            <div className="mt-3 rounded-md border border-border bg-accent/30 p-3">
              <div className="text-xs font-semibold text-muted-foreground">Change notes</div>
              <p className="text-sm text-body-foreground">{v.change_notes}</p>
            </div>
            <details className="mt-2 group">
              <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" /> View prompt text
              </summary>
              <pre className="mt-2 whitespace-pre-wrap rounded-md bg-muted/40 p-3 font-mono text-xs text-body-foreground">{v.prompt_text}</pre>
            </details>
          </div>
        ))}
      </div>

      <ExperimentsSection playbookId={pid} versions={versions} canEdit={canEdit} onVersionsChanged={load} />

      {/* New version dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New version of “{playbook.name}”</DialogTitle>
            <DialogDescription>
              This creates a new draft version — it never overwrites the current one. Activate it separately to make it live.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Prompt text</label>
              <Textarea value={promptText} onChange={(e) => setPromptText(e.target.value)} className="min-h-[160px] font-mono text-xs" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Change notes <span className="text-destructive">*</span>
              </label>
              <Textarea value={changeNotes} onChange={(e) => setChangeNotes(e.target.value)} placeholder="What changed and why?" className="min-h-[80px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button onClick={submitNew} disabled={createVersion.loading} className="gap-2">
              {createVersion.loading && <Loader2 className="h-4 w-4 animate-spin" />} Create version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={activateTarget != null} onOpenChange={(o) => !o && setActivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate v{activateTarget?.version_number}?</AlertDialogTitle>
            <AlertDialogDescription>
              This retires the current active version and routes all new drafts for this playbook through v{activateTarget?.version_number}.
              Existing drafts keep their original version tag.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmActivate}>Activate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
