import { Badge } from '../../lib/shadcn/badge'
import { STATUS_META } from '../../lib/console/types'

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, variant: 'outline' as const }
  return <Badge variant={meta.variant}>{meta.label}</Badge>
}
