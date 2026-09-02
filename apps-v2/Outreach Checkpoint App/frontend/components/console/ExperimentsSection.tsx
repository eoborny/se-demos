import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FlaskConical, Plus, Play, Square, Loader2, ChevronRight, Trash2 } from 'lucide-react'
import {
  useGetExperiments, useCreateExperiment, useStartExperiment, useStopExperiment, useCreatePlaybookVersion,
} from '../../hooks/backend/console'
import { Experiment, VersionAnalytics, EXPERIMENT_STATUS_META, relativeTime } from '../../lib/console/types'
import { Button } from '../../lib/shadcn/button'
import { Badge } from '../../lib/shadcn/badge'
import { Input } from '../../lib/shadcn/input'
import { Textarea } from '../../lib/shadcn/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../lib/shadcn/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '../../lib/shadcn/dialog'
import { toast } from '../../lib/shadcn/sonner'
import { useConsole } from '../../context/ConsoleContext'

type VariantDraft = { label: string; versionId: string; split: number }
const LABELS = ['A', 'B', 'C', 'D']

export function ExperimentsSection({
  playbookId, versions, canEdit, onVersionsChanged,
}: {
  playbookId: number
  versions: VersionAnalytics[]
  canEdit: boolean
  onVersionsChanged: () => void
}) {
  const navigate = useNavigate()
  const { actor, role } = useConsole()
  const { data, loading, trigger } = useGetExperiments()
  const createExp = useCreateExperiment()
  const startExp = useStartExperiment()
  const stopExp = useStopExperiment()
  const createVersion = useCreatePlaybookVersion()

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [hypothesis, setHypothesis] = useState('')
  const [variants, setVariants] = useState<VariantDraft[]>([
    { label: 'A', versionId: '', split: 50 },
    { label: 'B', versionId: '', split: 50 },
  ])
  const [newVerOpen, setNewVerOpen] = useState(false)
  const [verPrompt, setVerPrompt] = useState('')
  const [verNotes, setVerNotes] = useState('')

  const load = useCallback(() => { void trigger({ playbookId }, { skipCache: true }) }, [trigger, playbookId])
  useEffect(() => { load() }, [load])

  const experiments = (data as Experiment[] | undefined) ?? []
  const hasRunning = experiments.some((e) => e.status === 'running')

  const resetForm = () => {
    setName(''); setHypothesis('')
    setVariants([{ label: 'A', versionId: '', split: 50 }, { label: 'B', versionId: '', split: 50 }])
  }

  const splitSum = variants.reduce((s, v) => s + Number(v.split || 0), 0)

  const addVariant = () => {
    if (variants.length >= 4) return
    setVariants([...variants, { label: LABELS[variants.length] ?? 'X', versionId: '', split: 0 }])
  }
  const removeVariant = (i: number) => {
    if (variants.length <= 2) return
    setVariants(variants.filter((_, idx) => idx !== i).map((v, idx) => ({ ...v, label: LABELS[idx] ?? v.label })))
  }
  const updateVariant = (i: number, patch: Partial<VariantDraft>) => {
    setVariants(variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)))
  }

  const submitNewVersion = async () => {
    if (!verPrompt.trim() || !verNotes.trim()) { toast.error('Prompt and change notes are required'); return }
    try {
      const res = (await createVersion.trigger({ playbookId, promptText: verPrompt, changeNotes: verNotes, actor, role }).result) as { version_number: number }
      toast.success(`v${res.version_number} created — select it in a variant dropdown`)
      setNewVerOpen(false); setVerPrompt(''); setVerNotes('')
      onVersionsChanged()
    } catch (e) {
      toast.error('Could not create version', { description: e instanceof Error ? e.message : String(e) })
    }
  }

  const submit = async () => {
    if (!name.trim()) { toast.error('Experiment name is required'); return }
    if (variants.some((v) => !v.versionId)) { toast.error('Every variant needs a version'); return }
    if (splitSum !== 100) { toast.error(`Traffic splits must sum to 100 (currently ${splitSum})`); return }
    try {
      await createExp.trigger({
        playbookId, name, hypothesis: hypothesis || undefined,
        variants: variants.map((v) => ({ playbookVersionId: Number(v.versionId), label: v.label, trafficSplit: Number(v.split) })),
        actor, role,
      }).result
      toast.success('Experiment created (draft)', { description: 'Start it to begin splitting traffic.' })
      setOpen(false); resetForm(); load()
    } catch (e) {
      toast.error('Could not create experiment', { description: e instanceof Error ? e.message : String(e) })
    }
  }

  const doStart = async (e: Experiment) => {
    try {
      await startExp.trigger({ experimentId: e.id, actor, role }).result
      toast.success(`Started "${e.name}"`)
      load()
    } catch (err) {
      toast.error('Could not start', { description: err instanceof Error ? err.message : String(err) })
    }
  }
  const doStop = async (e: Experiment) => {
    try {
      await stopExp.trigger({ experimentId: e.id, actor, role }).result
      toast.success(`Stopped "${e.name}"`)
      load()
    } catch (err) {
      toast.error('Could not stop', { description: err instanceof Error ? err.message : String(err) })
    }
  }

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <FlaskConical className="h-4 w-4" /> A/B Experiments
        </h2>
        {canEdit && (
          <Button size="sm" className="gap-2" onClick={() => { resetForm(); setOpen(true) }}>
            <Plus className="h-4 w-4" /> New experiment
          </Button>
        )}
      </div>

      {loading && experiments.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading experiments…
        </div>
      ) : experiments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          No experiments yet. Run two versions side by side to compare reply rates.
        </div>
      ) : (
        <div className="space-y-2.5">
          {experiments.map((e) => (
            <div key={e.id} className="rounded-lg border border-border bg-card p-4 shadow-retool-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button className="group flex items-center gap-2 text-left" onClick={() => navigate(`/experiments/${e.id}`)}>
                  <span className="font-semibold text-foreground">{e.name}</span>
                  <Badge variant={EXPERIMENT_STATUS_META[e.status]?.variant ?? 'outline'}>{EXPERIMENT_STATUS_META[e.status]?.label ?? e.status}</Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </button>
                {canEdit && (
                  <div className="flex gap-2">
                    {e.status === 'draft' && (
                      <Button size="sm" variant="outline" className="gap-1.5" disabled={hasRunning || startExp.loading} onClick={() => doStart(e)}>
                        <Play className="h-3.5 w-3.5" /> Start
                      </Button>
                    )}
                    {e.status === 'running' && (
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => doStop(e)}>
                        <Square className="h-3.5 w-3.5" /> Stop
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {e.variants.map((v) => (
                  <span key={v.id} className="inline-flex items-center gap-1">
                    <Badge variant="outline" className="text-[10px]">{v.label}</Badge> v{v.version_number} · {v.traffic_split}% · {v.draft_count} drafts
                  </span>
                ))}
                <span>· {e.status === 'draft' ? `created ${relativeTime(e.created_at)}` : e.started_at ? `started ${relativeTime(e.started_at)}` : ''}</span>
              </div>
              {e.status === 'draft' && hasRunning && canEdit && (
                <p className="mt-1 text-[11px] text-warning">Another experiment is running — stop it before starting this one.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create experiment dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>New A/B experiment</DialogTitle>
            <DialogDescription>
              Split new drafts for this playbook across versions. Reps won&apos;t see which variant a draft belongs to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Concise v3 vs v2" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Hypothesis</label>
              <Textarea value={hypothesis} onChange={(e) => setHypothesis(e.target.value)} placeholder="What do you expect to change and why?" className="min-h-[60px]" />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Variants</label>
                <div className="flex items-center gap-2">
                  <Button type="button" size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => setNewVerOpen(true)}>
                    <Plus className="h-3.5 w-3.5" /> New version
                  </Button>
                  {variants.length < 4 && (
                    <Button type="button" size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={addVariant}>
                      <Plus className="h-3.5 w-3.5" /> Add variant
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                {variants.map((v, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Badge variant="secondary" className="w-7 shrink-0 justify-center">{v.label}</Badge>
                    <Select value={v.versionId} onValueChange={(val) => updateVariant(i, { versionId: val })}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Pick a version" /></SelectTrigger>
                      <SelectContent>
                        {versions.map((ver) => (
                          <SelectItem key={ver.id} value={String(ver.id)}>v{ver.version_number} ({ver.status})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex w-24 items-center gap-1">
                      <Input type="number" min={0} max={100} value={v.split} onChange={(e) => updateVariant(i, { split: Number(e.target.value) })} />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                    {variants.length > 2 && (
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeVariant(i)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className={`mt-1 text-xs ${splitSum === 100 ? 'text-muted-foreground' : 'text-destructive'}`}>
                Traffic splits total {splitSum}% (must equal 100%).
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={createExp.loading} className="gap-2">
              {createExp.loading && <Loader2 className="h-4 w-4 animate-spin" />} Create experiment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inline new-version dialog */}
      <Dialog open={newVerOpen} onOpenChange={setNewVerOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New version (inline)</DialogTitle>
            <DialogDescription>Creates a draft version you can then pick as a variant.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Prompt text</label>
              <Textarea value={verPrompt} onChange={(e) => setVerPrompt(e.target.value)} className="min-h-[140px] font-mono text-xs" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Change notes</label>
              <Textarea value={verNotes} onChange={(e) => setVerNotes(e.target.value)} className="min-h-[60px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewVerOpen(false)}>Cancel</Button>
            <Button onClick={submitNewVersion} disabled={createVersion.loading} className="gap-2">
              {createVersion.loading && <Loader2 className="h-4 w-4 animate-spin" />} Create version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
