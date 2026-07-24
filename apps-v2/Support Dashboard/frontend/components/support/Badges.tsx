import { Badge } from '../../lib/shadcn/badge'
import { priorityVariant, statusVariant, statusLabel } from '../../utils/support'

export function PriorityBadge({ priority }: { priority: string }) {
  return <Badge variant={priorityVariant(priority)}>{priority}</Badge>
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={statusVariant(status)}>{statusLabel(status)}</Badge>
}
