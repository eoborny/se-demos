import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { AlertTriangle, ExternalLink, Building2, User as UserIcon, Clock } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../lib/shadcn/sheet'
import { NativeSelect } from '../lib/shadcn/native-select'
import { Label } from '../lib/shadcn/label'
import { toast } from '../lib/shadcn/sonner'
import {
  useGetTicketById,
  useGetNotesByTicket,
  useGetHistoryByTicket,
  useGetAISummary,
  useUpdateTicket,
  useGetFilterOptions,
} from '../hooks/backend/support'
import {
  ALL_STATUSES,
  C,
  slaCountdown,
  slaToneColor,
  statusLabel,
} from '../lib/cursor'
import type { AISummaryRow, HistoryRow, NoteRow, TicketDetail } from '../lib/types'
import { useWorkbench } from '../lib/workbench'
import { StatusBadge, PriorityBadge } from './Badges'
import { NotesThread } from './drawer/NotesThread'
import { HistoryTimeline } from './drawer/HistoryTimeline'
import { AiSummaryPanel } from './drawer/AiSummaryPanel'
import { EscalateDialog } from './drawer/EscalateDialog'

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>
      {children}
    </h3>
  )
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-xs" style={{ color: C.muted }}>
        {label}
      </span>
      <span className="text-sm text-right font-medium" style={{ color: C.text }}>
        {value ?? '—'}
      </span>
    </div>
  )
}

export function TicketDetailDrawer() {
  const { selectedTicketId, closeTicket, refreshData } = useWorkbench()
  const open = selectedTicketId != null

  const ticketFn = useGetTicketById()
  const notesFn = useGetNotesByTicket()
  const historyFn = useGetHistoryByTicket()
  const summaryFn = useGetAISummary()
  const updateFn = useUpdateTicket()
  const optionsFn = useGetFilterOptions()

  const [escalateOpen, setEscalateOpen] = useState(false)

  const loadAll = useCallback(
    (id: number) => {
      void ticketFn.trigger({ id }, { skipCache: true })
      void notesFn.trigger({ ticketId: id }, { skipCache: true })
      void historyFn.trigger({ ticketId: id }, { skipCache: true })
      void summaryFn.trigger({ ticketId: id }, { skipCache: true })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  useEffect(() => {
    if (selectedTicketId != null) {
      loadAll(selectedTicketId)
      void optionsFn.trigger({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTicketId])

  const ticket = (ticketFn.data as TicketDetail | null) ?? null
  const notes = (notesFn.data as NoteRow[] | undefined) ?? []
  const history = (historyFn.data as HistoryRow[] | undefined) ?? []
  const summary = (summaryFn.data as AISummaryRow | null) ?? null
  const assignees = ((optionsFn.data as { assignees?: string[] } | undefined)?.assignees) ?? []

  const refreshLocal = useCallback(() => {
    if (selectedTicketId != null) loadAll(selectedTicketId)
    refreshData()
  }, [selectedTicketId, loadAll, refreshData])

  const applyUpdate = async (changes: Record<string, unknown>, message: string) => {
    if (!ticket) return
    try {
      await updateFn.trigger({ id: ticket.id, changes }).result
      toast.success(message)
      refreshLocal()
    } catch (e) {
      toast.error(`Update failed: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const assigneeOptions = ticket?.assignee_email && !assignees.includes(ticket.assignee_email)
    ? [ticket.assignee_email, ...assignees]
    : assignees

  const sla = ticket ? slaCountdown(ticket.sla_due_at, ticket.status) : null

  return (
    <Sheet open={open} onOpenChange={(o) => (!o ? closeTicket() : undefined)}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 flex flex-col cursor-scroll"
        style={{ backgroundColor: C.bg }}
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b space-y-3" style={{ borderColor: C.border }}>
          {ticket ? (
            <>
              <div className="flex items-center gap-3 flex-wrap pr-8">
                <SheetTitle className="font-mono-ticket text-base" style={{ color: C.text }}>
                  {ticket.ticket_number}
                </SheetTitle>
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                  style={{ backgroundColor: C.bgSecondary, color: C.muted }}
                >
                  {ticket.ticket_type}
                </span>
              </div>
              {sla && (
                <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: slaToneColor(sla.tone) }}>
                  <Clock className="h-3.5 w-3.5" />
                  {sla.text}
                </div>
              )}
            </>
          ) : (
            <SheetTitle style={{ color: C.text }}>Loading ticket…</SheetTitle>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto cursor-scroll px-6 py-5 space-y-6">
          {ticket && (
            <>
              {/* Subject + description */}
              <div>
                <h2 className="text-lg font-semibold mb-1" style={{ color: C.text }}>
                  {ticket.subject}
                </h2>
                <p className="text-sm whitespace-pre-wrap" style={{ color: C.muted }}>
                  {ticket.description || 'No description provided.'}
                </p>
                {ticket.linear_issue_id && (
                  <a
                    href={`https://linear.app/issue/${encodeURIComponent(ticket.linear_issue_id)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-sm font-medium"
                    style={{ color: C.orange }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {ticket.linear_issue_id}
                  </a>
                )}
              </div>

              {/* Assignee + status controls */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="d-assignee" className="text-xs font-medium" style={{ color: C.muted }}>
                    Assignee
                  </Label>
                  <NativeSelect
                    id="d-assignee"
                    value={ticket.assignee_email ?? ''}
                    onChange={(e) => applyUpdate({ assignee_email: e.target.value || null }, 'Assignee updated')}
                    style={{ backgroundColor: C.surface, borderColor: C.border, color: C.text }}
                  >
                    <option value="">Unassigned</option>
                    {assigneeOptions.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="d-status" className="text-xs font-medium" style={{ color: C.muted }}>
                    Status
                  </Label>
                  <NativeSelect
                    id="d-status"
                    value={ticket.status}
                    onChange={(e) => applyUpdate({ status: e.target.value }, 'Status updated')}
                    style={{ backgroundColor: C.surface, borderColor: C.border, color: C.text }}
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {statusLabel(s)}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              </div>

              {/* Contact card */}
              {ticket.ticket_type === 'external' && ticket.customer_pk != null && (
                <div className="rounded-xl border p-4" style={{ backgroundColor: C.surface, borderColor: C.border }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4" style={{ color: C.muted }} />
                    <SectionTitle>Customer</SectionTitle>
                  </div>
                  <InfoRow label="Name" value={ticket.customer_name} />
                  <InfoRow label="Email" value={ticket.customer_email} />
                  <InfoRow label="Company" value={ticket.customer_company} />
                  <InfoRow label="Plan" value={ticket.customer_plan_tier} />
                  <InfoRow label="Account ID" value={ticket.customer_account_id} />
                  <button
                    type="button"
                    onClick={() => applyUpdate({ status: 'WaitingOnCustomer' }, 'Marked waiting on customer')}
                    className="mt-3 w-full rounded-full px-4 py-2 text-sm font-medium border transition-colors"
                    style={{ backgroundColor: 'rgba(232,212,160,0.4)', borderColor: C.border, color: C.text }}
                  >
                    Waiting on Customer
                  </button>
                </div>
              )}

              {ticket.ticket_type === 'internal' && ticket.employee_pk != null && (
                <div className="rounded-xl border p-4" style={{ backgroundColor: C.surface, borderColor: C.border }}>
                  <div className="flex items-center gap-2 mb-2">
                    <UserIcon className="h-4 w-4" style={{ color: C.muted }} />
                    <SectionTitle>Employee</SectionTitle>
                  </div>
                  <InfoRow label="Name" value={ticket.employee_name} />
                  <InfoRow label="Email" value={ticket.employee_email} />
                  <InfoRow label="Department" value={ticket.employee_department} />
                  <InfoRow label="Manager" value={ticket.employee_manager} />
                  <InfoRow label="Location" value={ticket.employee_location} />
                  <button
                    type="button"
                    onClick={() => applyUpdate({ status: 'WaitingOnInternal' }, 'Marked waiting on internal')}
                    className="mt-3 w-full rounded-full px-4 py-2 text-sm font-medium border transition-colors"
                    style={{ backgroundColor: 'rgba(232,212,160,0.4)', borderColor: C.border, color: C.text }}
                  >
                    Waiting on Internal
                  </button>
                </div>
              )}

              {/* AI summary */}
              <AiSummaryPanel
                ticketId={ticket.id}
                summary={summary}
                loading={summaryFn.loading}
                onGenerated={refreshLocal}
              />

              {/* Notes */}
              <div>
                <SectionTitle>Notes</SectionTitle>
                <NotesThread ticketId={ticket.id} notes={notes} loading={notesFn.loading} onAdded={refreshLocal} />
              </div>

              {/* History */}
              <div>
                <SectionTitle>History</SectionTitle>
                <HistoryTimeline history={history} loading={historyFn.loading} />
              </div>
            </>
          )}
        </div>

        {/* Action bar */}
        {ticket && (
          <div
            className="flex items-center gap-2 border-t px-6 py-3"
            style={{ borderColor: C.border, backgroundColor: C.surface }}
          >
            <button
              type="button"
              onClick={() => setEscalateOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium border transition-colors"
              style={{ backgroundColor: 'rgba(207,45,86,0.08)', borderColor: C.border, color: C.error }}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Escalate
            </button>
            <button
              type="button"
              onClick={() => applyUpdate({ status: 'Resolved' }, 'Ticket resolved')}
              className="rounded-full px-4 py-2 text-sm font-medium border transition-colors"
              style={{ backgroundColor: 'rgba(168,220,200,0.4)', borderColor: C.border, color: C.success }}
            >
              Resolve
            </button>
            <button
              type="button"
              onClick={() => applyUpdate({ status: 'Closed' }, 'Ticket closed')}
              className="ml-auto rounded-full px-4 py-2 text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: C.text }}
            >
              Close Ticket
            </button>
          </div>
        )}

        {ticket && (
          <EscalateDialog
            ticketId={ticket.id}
            open={escalateOpen}
            onOpenChange={setEscalateOpen}
            onEscalated={refreshLocal}
            currentLinearId={ticket.linear_issue_id}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
