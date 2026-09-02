import { useEffect, useState, useCallback } from 'react'
import { SlidersHorizontal, Plus, Pencil, Trash2, Loader2, ShieldCheck } from 'lucide-react'
import {
  useGetRoutingRules, useSaveRoutingRule, useToggleRoutingRule, useDeleteRoutingRule,
} from '../hooks/backend/console'
import { useConsole } from '../context/ConsoleContext'
import { Button } from '../lib/shadcn/button'
import { Input } from '../lib/shadcn/input'
import { Textarea } from '../lib/shadcn/textarea'
import { Switch } from '../lib/shadcn/switch'
import { Badge } from '../lib/shadcn/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../lib/shadcn/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '../lib/shadcn/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../lib/shadcn/alert-dialog'
import { toast } from '../lib/shadcn/sonner'

type Rule = {
  id: number
  name: string
  rule_type: string
  pattern: string
  approver: string
  enabled: boolean
  description: string | null
}

const RULE_TYPES = [
  { value: 'keyword', label: 'Keyword match', hint: 'Comma-separated terms. Matches if any appear in the draft.' },
  { value: 'account_tier', label: 'Account tier', hint: 'Matches drafts for this account tier (e.g. Enterprise).' },
  { value: 'deal_size', label: 'Deal-size threshold', hint: 'ARR threshold in dollars.' },
  { value: 'sentiment', label: 'Sentiment', hint: 'e.g. negative.' },
]

const empty = { id: 0, name: '', rule_type: 'keyword', pattern: '', approver: 'Dana Whitfield', enabled: true, description: '' }

export default function AdminPage() {
  const { actor, role } = useConsole()
  const { data, loading, trigger } = useGetRoutingRules()
  const save = useSaveRoutingRule()
  const toggle = useToggleRoutingRule()
  const del = useDeleteRoutingRule()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ ...empty })
  const [deleteTarget, setDeleteTarget] = useState<Rule | null>(null)

  const load = useCallback(() => { void trigger({}, { skipCache: true }) }, [trigger])
  useEffect(() => { load() }, [load])

  const rules = (data as Rule[] | undefined) ?? []

  const openNew = () => { setForm({ ...empty }); setDialogOpen(true) }
  const openEdit = (r: Rule) => {
    setForm({ id: r.id, name: r.name, rule_type: r.rule_type, pattern: r.pattern, approver: r.approver, enabled: r.enabled, description: r.description ?? '' })
    setDialogOpen(true)
  }

  const submit = async () => {
    if (!form.name.trim() || !form.pattern.trim()) {
      toast.error('Name and pattern are required')
      return
    }
    try {
      await save.trigger({
        id: form.id || undefined,
        name: form.name.trim(),
        ruleType: form.rule_type,
        pattern: form.pattern.trim(),
        approver: form.approver.trim() || 'Dana Whitfield',
        enabled: form.enabled,
        description: form.description.trim() || undefined,
        actor, role,
      }).result
      toast.success(form.id ? 'Rule updated' : 'Rule created')
      setDialogOpen(false)
      load()
    } catch (e) {
      toast.error('Save failed', { description: e instanceof Error ? e.message : String(e) })
    }
  }

  const onToggle = async (r: Rule, enabled: boolean) => {
    try {
      await toggle.trigger({ id: r.id, enabled, name: r.name, actor, role }).result
      load()
    } catch (e) {
      toast.error('Update failed', { description: e instanceof Error ? e.message : String(e) })
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await del.trigger({ id: deleteTarget.id, name: deleteTarget.name, actor, role }).result
      toast.success('Rule deleted')
      setDeleteTarget(null)
      load()
    } catch (e) {
      toast.error('Delete failed', { description: e instanceof Error ? e.message : String(e) })
    }
  }

  const activeType = RULE_TYPES.find((t) => t.value === form.rule_type)

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <SlidersHorizontal className="h-6 w-6 text-primary" /> Sensitive-Content Routing Rules
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Config-driven rules decide which drafts route to an approver before send — no engineering request needed.
          </p>
        </div>
        <Button className="gap-2" onClick={openNew}><Plus className="h-4 w-4" /> New rule</Button>
      </div>

      {loading && rules.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading rules…
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((r) => (
            <div key={r.id} className="flex items-start gap-4 rounded-lg border border-border bg-card p-4 shadow-retool-sm">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground">{r.name}</span>
                  <Badge variant="outline" className="text-[10px] capitalize">{r.rule_type.replace('_', ' ')}</Badge>
                  {r.enabled ? (
                    <Badge variant="success" className="text-[10px]">Active</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">Disabled</Badge>
                  )}
                </div>
                {r.description && <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span><span className="font-medium text-body-foreground">Pattern:</span> {r.pattern}</span>
                  <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> {r.approver}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Switch checked={r.enabled} onCheckedChange={(v) => onToggle(r, v)} aria-label={`Toggle ${r.name}`} />
                <Button variant="ghost" size="icon" onClick={() => openEdit(r)} aria-label="Edit rule">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(r)} aria-label="Delete rule" className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {rules.length === 0 && (
            <div className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
              No routing rules yet. Create one to start routing sensitive drafts.
            </div>
          )}
        </div>
      )}

      {/* Rule editor dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit routing rule' : 'New routing rule'}</DialogTitle>
            <DialogDescription>Drafts matching this rule route to the designated approver before send.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Rule name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Pricing exceptions" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Rule type</label>
              <Select value={form.rule_type} onValueChange={(v) => setForm({ ...form, rule_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RULE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {activeType && <p className="mt-1 text-xs text-muted-foreground">{activeType.hint}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Pattern</label>
              <Input value={form.pattern} onChange={(e) => setForm({ ...form, pattern: e.target.value })} placeholder="discount, % off, waive fee" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Approver</label>
              <Input value={form.approver} onChange={(e) => setForm({ ...form, approver: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Description (optional)</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-h-[70px]" />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <span className="text-sm font-medium text-foreground">Enabled</span>
              <Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={save.loading} className="gap-2">
              {save.loading && <Loader2 className="h-4 w-4 animate-spin" />} {form.id ? 'Save changes' : 'Create rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget != null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleteTarget?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This routing rule will no longer flag matching drafts for approval. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
