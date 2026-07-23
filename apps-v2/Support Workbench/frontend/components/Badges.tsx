import { priorityBadgeStyle, statusBadgeStyle, statusLabel } from '../lib/cursor'

const base =
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap'

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={base} style={statusBadgeStyle(status)}>
      {statusLabel(status)}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={base} style={priorityBadgeStyle(priority)}>
      {priority}
    </span>
  )
}
