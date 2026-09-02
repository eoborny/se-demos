import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Check, Pencil, X, Send, AlertTriangle, GitCompare, Loader2, UserCog, Sparkles, Activity, Wand2,
} from 'lucide-react'
import { useConsole } from '../context/ConsoleContext'
import {
  useGetDraft, useApproveDraft, useEditApproveDraft, useRejectDraft,
  useApproverDecision, useReassignDraft, useSendDraft, useLogDraftOutcome,
  useRegenerateDraft, useUpdateDraftContent,
} from '../hooks/backend/console'
import { Draft, REASON_CODES, REPS, PRIORITY_META, relativeTime, OUTCOME_TYPES } from '../lib/console/types'
import { StatusBadge } from '../components/console/StatusBadge'
import { VersionBadge } from '../components/console/VersionBadge'
import { ResearchPanel } from '../components/console/ResearchPanel'
import { DiffView } from '../components/console/DiffView'
import { Button } from '../lib/shadcn/button'
import { Badge } from '../lib/shadcn/badge'
import { Textarea } from '../lib/shadcn/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../lib/shadcn/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '../lib/shadcn/dialog'
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '../lib/shadcn/sheet'
import { toast } from '../lib/shadcn/sonner'
import { hasChanges } from '../lib/console/diff'

const REGEN_SUGGESTIONS = [
  'Make it shorter',
  'Warmer tone',
  'Lead with the trigger event',
  'Drop any stats or guarantees',
  'Stronger call to action',
  'More formal',
]

export default function DraftReviewPage() {
  const { id } = useParams()
  const draftId = Number(id)
  const navigate = useNavigate()
  const { role, actor } = useConsole()

  const { data, loading, trigger: fetchDraft } = useGetDraft()
  const approve = useApproveDraft()
  const editApprove = useEditApproveDraft()
  const reject = useRejectDraft()
  const approverDecision = useApproverDecision()
  const reassign = useReassignDraft()
  const send = useSendDraft()
  const logOutcome = useLogDraftOutcome()
  const regenerate = useRegenerateDraft()
  const updateContent = useUpdateDraftContent()

  const [content, setContent] = useState('')
  const [editing, setEditing] = useState(false)
  const [showDiff, setShowDiff] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState<string>(REASON_CODES[0])
  const [note, setNote] = useState('')
  const [reassignOpen, setReassignOpen] = useState(false)
  const [newRep, setNewRep] = useState<string>(REPS[0])
  const [outcomeOpen, setOutcomeOpen] = useState(false)
  const [outcomeType, setOutcomeType] = useState<string>(OUTCOME_TYPES[1])
  const [outcomeSource, setOutcomeSource] = useState('')
  const [regenOpen, setRegenOpen] = useState(false)
  const [regenPrompt, setRegenPrompt] = useState('')
  const [proposed, setProposed] = useState<string | null>(null)

  useEffect(() => {
    if (Number.isFinite(draftId)) void fetchDraft({ id: draftId, actor, role }, { skipCache: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId, actor, role])

  const draft = data as Draft | undefined

  useEffect(() => {
    if (draft) setContent(draft.current_content)
  }, [draft])

  const refetch = () => fetchDraft({ id: draftId, actor, role }, { skipCache: true })

  if (loading && !draft) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading draft…
      </div>
    )
  }
  if (!draft) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to queue
        </Button>
        <div className="rounded-lg border border-dashed border-border py-20 text-center text-muted-foreground">
          Draft not found.
        </div>
      </div>
    )
  }

  const edited = hasChanges(draft.ai_original, content)
  const isOwnerActor = role === 'rep' || role === 'manager' || role === 'admin'
  const canReview = draft.status === 'Pending Review' && isOwnerActor
  const isApproverStage = draft.status === 'Pending Sensitive-Content Approval'
  const canApproverAct = isApproverStage && (role === 'approver' || role === 'admin')
  const canSend = (draft.status === 'Approved' || draft.status === 'Edited & Approved') && isOwnerActor
  const backTarget = role === 'approver' ? '/approvals' : '/'

  const runApprove = async () => {
    try {
      const res = (await approve.trigger({ id: draft.id, actor, role }).result) as { routed: boolean; reason?: string }
      if (res.routed) toast.warning('Routed for sensitive-content approval', { description: res.reason ?? undefined })
      else toast.success('Draft approved')
      await refetch()
    } catch (e) {
      toast.error('Approve failed', { description: e instanceof Error ? e.message : String(e) })
    }
  }

  const runEditApprove = async () => {
    try {
      const res = (await editApprove.trigger({ id: draft.id, newContent: content, actor, role }).result) as { routed: boolean; reason?: string }
      if (res.routed) toast.warning('Edited draft routed for sensitive-content approval', { description: res.reason ?? undefined })
      else toast.success('Draft edited & approved')
      setEditing(false)
      await refetch()
    } catch (e) {
      toast.error('Save failed', { description: e instanceof Error ? e.message : String(e) })
    }
  }

  const runReject = async () => {
    try {
      const reasonLabel = note.trim() ? `${reason} — ${note.trim()}` : reason
      if (canApproverAct) {
        await approverDecision.trigger({ id: draft.id, decision: 'reject', reasonCode: reason, comment: note.trim() || undefined, actor, role }).result
      } else {
        await reject.trigger({ id: draft.id, reasonCode: reasonLabel, actor, role }).result
      }
      toast.success('Draft rejected')
      setRejectOpen(false)
      setNote('')
      await refetch()
    } catch (e) {
      toast.error('Reject failed', { description: e instanceof Error ? e.message : String(e) })
    }
  }

  const runApproverApprove = async () => {
    try {
      await approverDecision.trigger({ id: draft.id, decision: 'approve', comment: note.trim() || undefined, actor, role }).result
      toast.success('Sensitive draft approved')
      setNote('')
      await refetch()
    } catch (e) {
      toast.error('Approve failed', { description: e instanceof Error ? e.message : String(e) })
    }
  }

  const runLogOutcome = async () => {
    try {
      await logOutcome.trigger({ draftId: draft.id, eventType: outcomeType, source: outcomeSource.trim() || undefined, actor, role }).result
      toast.success(`Outcome logged: ${outcomeType}`)
      setOutcomeOpen(false)
      setOutcomeSource('')
    } catch (e) {
      toast.error('Could not log outcome', { description: e instanceof Error ? e.message : String(e) })
    }
  }

  const runRegenerate = async () => {
    if (!regenPrompt.trim()) { toast.error('Describe what you want changed'); return }
    try {
      const res = (await regenerate.trigger({ id: draft.id, prompt: regenPrompt, actor, role }).result) as { content: string }
      setProposed(res.content)
    } catch (e) {
      toast.error('Regeneration failed', { description: e instanceof Error ? e.message : String(e) })
    }
  }

  const applyRegenerated = async () => {
    if (!proposed) return
    try {
      await updateContent.trigger({ id: draft.id, content: proposed, actor, role }).result
      toast.success('Draft updated with AI regeneration')
      setRegenOpen(false)
      setProposed(null)
      setRegenPrompt('')
      setEditing(false)
      setShowDiff(false)
      await refetch()
    } catch (e) {
      toast.error('Could not apply', { description: e instanceof Error ? e.message : String(e) })
    }
  }

  const runReassign = async () => {
    try {
      await reassign.trigger({ id: draft.id, newRep, actor, role }).result
      toast.success(`Reassigned to ${newRep}`)
      setReassignOpen(false)
      await refetch()
    } catch (e) {
      toast.error('Reassign failed', { description: e instanceof Error ? e.message : String(e) })
    }
  }

  const runSend = async () => {
    try {
      await send.trigger({ id: draft.id, actor, role }).result
      toast.success('Handed off to sequencing tool')
      await refetch()
    } catch (e) {
      toast.error('Send failed', { description: e instanceof Error ? e.message : String(e) })
    }
  }

  const busy = approve.loading || editApprove.loading || reject.loading || approverDecision.loading || send.loading

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(backTarget)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to {role === 'approver' ? 'approvals' : 'queue'}
        </Button>
        {(role === 'manager' || role === 'admin') && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setOutcomeOpen(true)}>
              <Activity className="h-4 w-4" /> Log outcome
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setReassignOpen(true)}>
              <UserCog className="h-4 w-4" /> Reassign
            </Button>
          </div>
        )}
      </div>

      {/* Account header */}
      <div className="mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{draft.account_name}</h1>
          <Badge variant="outline">{draft.account_tier}</Badge>
          <StatusBadge status={draft.status} />
          <Badge variant={PRIORITY_META[draft.priority] ?? 'secondary'}>{draft.priority} priority</Badge>
          {!draft.experiment_id && <VersionBadge versionNumber={draft.playbook_version_number} playbookName={draft.playbook_name} />}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {draft.contact_name}{draft.contact_title ? `, ${draft.contact_title}` : ''} · {draft.outreach_type}
          {draft.sequence_step ? ` · ${draft.sequence_step}` : ''} · Assigned to {draft.rep_name} · {relativeTime(draft.created_at)}
        </p>
      </div>

      {draft.sensitive && draft.sensitive_reason && (
        <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-warning/40 bg-warning/10 p-3.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div className="text-sm">
            <div className="font-semibold text-foreground">Sensitive content detected</div>
            <div className="text-body-foreground">{draft.sensitive_reason}</div>
            {draft.approver && (
              <div className="mt-0.5 text-xs text-muted-foreground">Routed to approver: {draft.approver}</div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* Draft column */}
        <div className="lg:col-span-3">
          <div className="rounded-lg border border-border bg-card shadow-retool-sm">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-primary" /> AI Draft
                {edited && <Badge variant="secondary" className="text-[10px]">edited</Badge>}
              </div>
              <div className="flex items-center gap-1">
                {isOwnerActor && (
                  <Button variant="ghost" size="sm" className="gap-1.5 text-primary hover:text-primary" onClick={() => { setProposed(null); setRegenPrompt(''); setRegenOpen(true) }}>
                    <Wand2 className="h-4 w-4" /> Regenerate with AI
                  </Button>
                )}
                {edited && (
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setShowDiff((s) => !s)}>
                    <GitCompare className="h-4 w-4" /> {showDiff ? 'Hide diff' : 'Show diff'}
                  </Button>
                )}
                {canReview && !editing && (
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setEditing(true)}>
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                )}
              </div>
            </div>

            <div className="p-4">
              {draft.subject && (
                <div className="mb-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Subject</div>
                  <div className="mt-0.5 font-medium text-foreground">{draft.subject}</div>
                </div>
              )}

              {showDiff && edited ? (
                <DiffView original={draft.ai_original} edited={content} />
              ) : editing ? (
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[320px] font-sans leading-relaxed"
                />
              ) : (
                <div className="whitespace-pre-wrap rounded-md bg-muted/30 p-4 text-sm leading-relaxed text-body-foreground">
                  {content}
                </div>
              )}

              {draft.approver_comment && (
                <div className="mt-4 rounded-md border border-border bg-accent/40 p-3 text-sm">
                  <div className="text-xs font-semibold text-muted-foreground">Approver note</div>
                  <div className="text-body-foreground">{draft.approver_comment}</div>
                </div>
              )}
              {draft.reason_code && draft.status === 'Rejected' && (
                <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">
                  <div className="text-xs font-semibold text-destructive">Rejection reason</div>
                  <div className="text-body-foreground">{draft.reason_code}</div>
                </div>
              )}
            </div>

            {/* Action bar */}
            {(canReview || canApproverAct || canSend) && (
              <div className="flex flex-wrap items-center gap-2 border-t border-border p-4">
                {canReview && !editing && (
                  <>
                    <Button onClick={runApprove} disabled={busy} className="gap-2">
                      <Check className="h-4 w-4" /> Approve as-is
                    </Button>
                    <Button variant="outline" onClick={() => setEditing(true)} className="gap-2">
                      <Pencil className="h-4 w-4" /> Edit & approve
                    </Button>
                    <Button variant="outline" onClick={() => setRejectOpen(true)} className="gap-2 text-destructive hover:text-destructive">
                      <X className="h-4 w-4" /> Reject
                    </Button>
                  </>
                )}
                {canReview && editing && (
                  <>
                    <Button onClick={runEditApprove} disabled={busy} className="gap-2">
                      {editApprove.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Save & approve
                    </Button>
                    <Button variant="ghost" onClick={() => { setContent(draft.current_content); setEditing(false); setShowDiff(false) }}>
                      Cancel edit
                    </Button>
                  </>
                )}
                {canApproverAct && (
                  <>
                    <Button onClick={runApproverApprove} disabled={busy} className="gap-2">
                      <Check className="h-4 w-4" /> Approve for send
                    </Button>
                    <Button variant="outline" onClick={() => setRejectOpen(true)} className="gap-2 text-destructive hover:text-destructive">
                      <X className="h-4 w-4" /> Reject
                    </Button>
                  </>
                )}
                {canSend && (
                  <Button onClick={runSend} disabled={busy} className="gap-2">
                    <Send className="h-4 w-4" /> Hand off to send
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Research column */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-border bg-card p-4 shadow-retool-sm">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Research & signals</h2>
            <ResearchPanel draft={draft} />
          </div>
        </div>
      </div>

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject draft</DialogTitle>
            <DialogDescription>Record why this draft was rejected. This feeds the override analytics.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Reason code</label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REASON_CODES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Note (optional)</label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add context…" className="min-h-[80px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={runReject} disabled={busy} className="gap-2">
              {(reject.loading || approverDecision.loading) && <Loader2 className="h-4 w-4 animate-spin" />} Reject draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign dialog */}
      <Dialog open={reassignOpen} onOpenChange={setReassignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign draft</DialogTitle>
            <DialogDescription>Move this draft to a different rep&apos;s queue.</DialogDescription>
          </DialogHeader>
          <div className="py-1">
            <Select value={newRep} onValueChange={setNewRep}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REPS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignOpen(false)}>Cancel</Button>
            <Button onClick={runReassign} disabled={reassign.loading} className="gap-2">
              {reassign.loading && <Loader2 className="h-4 w-4 animate-spin" />} Reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log outcome dialog (manual fallback for the sequencer/CRM webhook) */}
      <Dialog open={outcomeOpen} onOpenChange={setOutcomeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log downstream outcome</DialogTitle>
            <DialogDescription>
              Manual fallback for the sequencing/CRM integration. Records a downstream event for this draft
              (feeds experiment reply-rate analytics).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Event type</label>
              <Select value={outcomeType} onValueChange={setOutcomeType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OUTCOME_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Source (optional)</label>
              <Textarea value={outcomeSource} onChange={(e) => setOutcomeSource(e.target.value)} placeholder="e.g. Outreach.io webhook" className="min-h-[60px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOutcomeOpen(false)}>Cancel</Button>
            <Button onClick={runLogOutcome} disabled={logOutcome.loading} className="gap-2">
              {logOutcome.loading && <Loader2 className="h-4 w-4 animate-spin" />} Log outcome
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate with AI slide-out */}
      <Sheet open={regenOpen} onOpenChange={setRegenOpen}>
        <SheetContent side="right" className="flex w-full flex-col overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-primary" /> Regenerate with AI</SheetTitle>
            <SheetDescription>
              Describe what you&apos;d like changed. The model rewrites the draft using the account research and context — you review the result before anything is applied.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">What should change?</label>
              <Textarea
                value={regenPrompt}
                onChange={(e) => setRegenPrompt(e.target.value)}
                placeholder="e.g. Make it shorter and warmer, lead with the trigger event, and drop the stat."
                className="min-h-[110px]"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {REGEN_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRegenPrompt((prev) => (prev.trim() ? `${prev.trim()}. ${s}` : s))}
                    className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={runRegenerate} disabled={regenerate.loading || !regenPrompt.trim()} className="w-full gap-2">
              {regenerate.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {proposed ? 'Regenerate again' : 'Generate draft'}
            </Button>

            {regenerate.loading && !proposed && (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Writing a new draft…
              </div>
            )}

            {proposed && (
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Proposed draft</div>
                <div className="whitespace-pre-wrap rounded-md border border-primary/30 bg-primary/5 p-4 text-sm leading-relaxed text-body-foreground">{proposed}</div>
                <div className="flex gap-2">
                  <Button onClick={applyRegenerated} disabled={updateContent.loading} className="flex-1 gap-2">
                    {updateContent.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Use this draft
                  </Button>
                  <Button variant="outline" onClick={() => setProposed(null)}>Discard</Button>
                </div>
                <p className="text-xs text-muted-foreground">Applying replaces the draft body. The review status is unchanged and the edit is recorded in the audit log.</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
