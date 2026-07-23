import { C, formatDateTime, slaCountdown, slaToneColor } from '../lib/cursor'
import type { TicketListRow } from '../lib/types'
import { StatusBadge, PriorityBadge } from './Badges'

type Props = {
  tickets: TicketListRow[]
  loading: boolean
  onRowClick: (id: number) => void
  emptyLabel?: string
}

export function MiniTicketList({ tickets, loading, onRowClick, emptyLabel }: Props) {
  if (loading) {
    return (
      <div className="text-sm" style={{ color: C.muted }}>
        Loading tickets…
      </div>
    )
  }
  if (tickets.length === 0) {
    return (
      <div className="text-sm" style={{ color: C.muted }}>
        {emptyLabel ?? 'No tickets found.'}
      </div>
    )
  }
  return (
    <div className="space-y-2">
      {tickets.map((t) => {
        const sla = slaCountdown(t.sla_due_at, t.status)
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onRowClick(t.id)}
            className="w-full text-left rounded-lg border p-3 transition-colors hover:shadow-retool-sm"
            style={{ backgroundColor: C.surface, borderColor: C.border }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono-ticket text-xs font-medium" style={{ color: C.text }}>
                {t.ticket_number}
              </span>
              <div className="flex items-center gap-1.5">
                <StatusBadge status={t.status} />
                <PriorityBadge priority={t.priority} />
              </div>
            </div>
            <div className="mt-1 text-sm font-medium truncate" style={{ color: C.text }}>
              {t.subject}
            </div>
            <div className="mt-0.5 flex items-center justify-between text-xs">
              <span style={{ color: C.muted }}>
                {t.category} · {formatDateTime(t.created_at)}
              </span>
              <span className="font-medium" style={{ color: slaToneColor(sla.tone) }}>
                {sla.text}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
