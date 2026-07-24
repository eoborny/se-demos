// Shared constants, labels, and formatters for the Support Dashboard.

export const STATUSES = [
  'New',
  'Triaged',
  'InProgress',
  'WaitingOnCustomer',
  'WaitingOnInternal',
  'Escalated',
  'Resolved',
  'Closed',
] as const

export const OPEN_STATUSES = [
  'New',
  'Triaged',
  'InProgress',
  'WaitingOnCustomer',
  'WaitingOnInternal',
  'Escalated',
]

export const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const

export const CATEGORIES = [
  'Access',
  'Bug',
  'Hardware',
  'Billing',
  'Account',
  'FeatureRequest',
  'Other',
] as const

export const TICKET_TYPES = ['internal', 'external'] as const

export const CHANNELS = ['Email', 'Slack', 'Phone', 'InApp', 'WalkUp'] as const

const STATUS_LABELS: Record<string, string> = {
  New: 'New',
  Triaged: 'Triaged',
  InProgress: 'In Progress',
  WaitingOnCustomer: 'Waiting on Customer',
  WaitingOnInternal: 'Waiting on Internal',
  Escalated: 'Escalated',
  Resolved: 'Resolved',
  Closed: 'Closed',
}

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status
}

export function categoryLabel(category: string): string {
  if (category === 'FeatureRequest') return 'Feature Request'
  return category
}

// Badge variant per priority (maps to shadcn Badge variants).
export function priorityVariant(priority: string): 'destructive' | 'warning' | 'secondary' | 'outline' {
  switch (priority) {
    case 'Urgent':
      return 'destructive'
    case 'High':
      return 'warning'
    case 'Medium':
      return 'secondary'
    default:
      return 'outline'
  }
}

export function statusVariant(status: string): 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'outline' {
  switch (status) {
    case 'Escalated':
      return 'destructive'
    case 'Resolved':
    case 'Closed':
      return 'success'
    case 'InProgress':
    case 'Triaged':
      return 'default'
    case 'WaitingOnCustomer':
    case 'WaitingOnInternal':
      return 'warning'
    default:
      return 'secondary'
  }
}

export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return '—'
  if (minutes < 60) return `${minutes}m`
  const hours = minutes / 60
  if (hours < 24) return `${hours.toFixed(1)}h`
  const days = hours / 24
  return `${days.toFixed(1)}d`
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Categorical color palette legible in both light and dark modes.
export const CHART_COLORS = [
  '#6366f1',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
]

export const PRIORITY_COLORS: Record<string, string> = {
  Urgent: '#ef4444',
  High: '#f59e0b',
  Medium: '#0ea5e9',
  Low: '#94a3b8',
}
