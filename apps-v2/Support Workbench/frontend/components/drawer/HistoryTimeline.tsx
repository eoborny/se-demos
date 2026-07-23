import { History } from 'lucide-react'
import { C, formatDateTime, statusLabel } from '../../lib/cursor'
import type { HistoryRow } from '../../lib/types'

function renderValue(field: string, value: string | null): string {
  if (value == null || value === '') return '—'
  if (field === 'status') return statusLabel(value)
  return value
}

function fieldLabel(field: string): string {
  switch (field) {
    case 'assignee_email':
      return 'Assignee'
    case 'linear_issue_id':
      return 'Linear issue'
    default:
      return field.charAt(0).toUpperCase() + field.slice(1)
  }
}

export function HistoryTimeline({ history, loading }: { history: HistoryRow[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="text-sm" style={{ color: C.muted }}>
        Loading history…
      </div>
    )
  }
  if (history.length === 0) {
    return (
      <div className="text-sm" style={{ color: C.muted }}>
        No history recorded.
      </div>
    )
  }

  return (
    <ol className="relative space-y-4 pl-5">
      {history.map((h) => (
        <li key={h.id} className="relative">
          <span
            className="absolute -left-5 top-1 flex h-3 w-3 items-center justify-center rounded-full"
            style={{ backgroundColor: C.orange }}
            aria-hidden="true"
          >
            <History className="h-2 w-2 text-white" />
          </span>
          <div className="text-sm" style={{ color: C.text }}>
            <span className="font-medium">{fieldLabel(h.field_changed)}</span>
            {' changed from '}
            <span className="font-medium">{renderValue(h.field_changed, h.old_value)}</span>
            {' to '}
            <span className="font-medium">{renderValue(h.field_changed, h.new_value)}</span>
          </div>
          <div className="text-[11px]" style={{ color: C.muted }}>
            {h.changed_by} · {formatDateTime(h.changed_at)}
          </div>
        </li>
      ))}
    </ol>
  )
}
