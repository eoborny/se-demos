import { useEffect, useCallback } from 'react'
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { useConsole } from '../context/ConsoleContext'
import { useGetDrafts } from '../hooks/backend/console'
import { Draft } from '../lib/console/types'
import { DraftCard } from '../components/console/DraftCard'
import { StatCard } from '../components/console/StatCard'

export default function ApproverQueuePage() {
  const { role, actor } = useConsole()
  const { data, loading, trigger } = useGetDrafts()

  const load = useCallback(() => {
    void trigger({ role, repName: actor }, { skipCache: true })
  }, [trigger, role, actor])

  useEffect(() => { load() }, [load])

  const drafts = (data as Draft[] | undefined) ?? []
  const pending = drafts.filter((d) => d.status === 'Pending Sensitive-Content Approval')
  const approved = drafts.filter((d) => d.status === 'Approved' || d.status === 'Edited & Approved' || d.status === 'Sent')
  const rejected = drafts.filter((d) => d.status === 'Rejected')

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
          <ShieldCheck className="h-6 w-6 text-primary" /> Sensitive-Content Approvals
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Drafts routed to you by the routing rules — reviewed separately so nothing sensitive gets lost in daily volume.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard label="Awaiting your review" value={pending.length} icon={<ShieldAlert className="h-4 w-4" />} accent="warning" />
        <StatCard label="Approved" value={approved.length} icon={<CheckCircle2 className="h-4 w-4" />} accent="success" />
        <StatCard label="Rejected" value={rejected.length} icon={<XCircle className="h-4 w-4" />} accent="destructive" />
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Awaiting review</h2>
      {loading && drafts.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : pending.length === 0 ? (
        <div className="mb-8 rounded-lg border border-dashed border-border py-14 text-center text-muted-foreground">
          <ShieldCheck className="mx-auto mb-3 h-8 w-8 opacity-50" />
          Nothing awaiting approval. You&apos;re all caught up.
        </div>
      ) : (
        <div className="mb-8 space-y-2.5">
          {pending.map((d) => <DraftCard key={d.id} draft={d} />)}
        </div>
      )}

      {(approved.length > 0 || rejected.length > 0) && (
        <>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recently decided</h2>
          <div className="space-y-2.5">
            {[...approved, ...rejected].map((d) => <DraftCard key={d.id} draft={d} />)}
          </div>
        </>
      )}
    </div>
  )
}
