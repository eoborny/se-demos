import { useEffect, useState, useCallback } from 'react'
import { Search, Inbox, ShieldAlert, CheckCircle2, XCircle, Zap, Loader2 } from 'lucide-react'
import { useConsole } from '../context/ConsoleContext'
import { useGetDrafts, useBulkApprove } from '../hooks/backend/console'
import { Draft, OUTREACH_TYPES, REPS } from '../lib/console/types'
import { DraftCard } from '../components/console/DraftCard'
import { StatCard } from '../components/console/StatCard'
import { Input } from '../lib/shadcn/input'
import { Button } from '../lib/shadcn/button'
import { Slider } from '../lib/shadcn/slider'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../lib/shadcn/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '../lib/shadcn/dialog'
import { toast } from '../lib/shadcn/sonner'

export default function QueuePage() {
  const { role, actor, persona } = useConsole()
  const { data, loading, trigger } = useGetDrafts()
  const bulk = useBulkApprove()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')
  const [priority, setPriority] = useState('all')
  const [sort, setSort] = useState('newest')
  const [repFilter, setRepFilter] = useState('all')
  const [threshold, setThreshold] = useState(85)
  const [bulkOpen, setBulkOpen] = useState(false)

  const repName = role === 'rep' ? actor : repFilter

  const load = useCallback(() => {
    void trigger(
      {
        role,
        repName: actor,
        status,
        outreachType: type,
        priority,
        search,
        sort,
      },
      { skipCache: true }
    )
  }, [trigger, role, actor, status, type, priority, search, sort])

  useEffect(() => {
    load()
  }, [load])

  const drafts = (data as Draft[] | undefined) ?? []
  const scoped = role === 'manager' && repFilter !== 'all'
    ? drafts.filter((d) => d.rep_name === repFilter)
    : drafts

  const counts = {
    pending: scoped.filter((d) => d.status === 'Pending Review').length,
    sensitive: scoped.filter((d) => d.status === 'Pending Sensitive-Content Approval').length,
    approved: scoped.filter((d) => d.status === 'Approved' || d.status === 'Edited & Approved').length,
    rejected: scoped.filter((d) => d.status === 'Rejected').length,
  }

  const runBulk = async () => {
    try {
      const res = await bulk.trigger({ threshold: threshold / 100, repName, actor, role }).result
      const r = res as { approved: number; skipped: number }
      toast.success(`Bulk-approved ${r.approved} draft${r.approved === 1 ? '' : 's'}`, {
        description: r.skipped > 0 ? `${r.skipped} routed to sensitive-content approval instead.` : undefined,
      })
      setBulkOpen(false)
      load()
    } catch (e) {
      toast.error('Bulk approve failed', { description: e instanceof Error ? e.message : String(e) })
    }
  }

  const isManager = role === 'manager' || role === 'admin'

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">AI Draft Review Queue</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {role === 'rep'
              ? `Your queue, ${persona.name.split(' ')[0]} — drafts tied to your accounts.`
              : 'Team-wide queue of AI-drafted outreach awaiting review.'}
          </p>
        </div>
        {isManager && (
          <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Zap className="h-4 w-4" /> Bulk approve
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk approve high-confidence drafts</DialogTitle>
                <DialogDescription>
                  Approve all pending drafts at or above a confidence threshold. Drafts that match a
                  sensitive-content rule are routed for approval instead of sent.
                </DialogDescription>
              </DialogHeader>
              <div className="py-2">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Confidence threshold</span>
                  <span className="font-semibold text-foreground">{threshold}%</span>
                </div>
                <Slider value={[threshold]} min={50} max={99} step={1} onValueChange={(v) => setThreshold(v[0] ?? 85)} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
                <Button onClick={runBulk} disabled={bulk.loading} className="gap-2">
                  {bulk.loading && <Loader2 className="h-4 w-4 animate-spin" />} Approve matching
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Pending Review" value={counts.pending} icon={<Inbox className="h-4 w-4" />} accent="primary" />
        <StatCard label="Sensitive Hold" value={counts.sensitive} icon={<ShieldAlert className="h-4 w-4" />} accent="warning" />
        <StatCard label="Approved" value={counts.approved} icon={<CheckCircle2 className="h-4 w-4" />} accent="success" />
        <StatCard label="Rejected" value={counts.rejected} icon={<XCircle className="h-4 w-4" />} accent="destructive" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search account, contact, subject…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Pending Review">Pending Review</SelectItem>
            <SelectItem value="Pending Sensitive-Content Approval">Pending Sensitive</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Edited & Approved">Edited & Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="Sent">Sent</SelectItem>
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {OUTREACH_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priority</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
        {isManager && (
          <Select value={repFilter} onValueChange={setRepFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All reps</SelectItem>
              {REPS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="confidence">Confidence</SelectItem>
            <SelectItem value="account">Account A–Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading && scoped.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading queue…
        </div>
      ) : scoped.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-20 text-center text-muted-foreground">
          <Inbox className="mx-auto mb-3 h-8 w-8 opacity-50" />
          No drafts match your filters.
        </div>
      ) : (
        <div className="space-y-2.5">
          {scoped.map((d) => <DraftCard key={d.id} draft={d} />)}
        </div>
      )}
    </div>
  )
}
