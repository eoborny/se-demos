import type { CSSProperties } from 'react'

export const C = {
  bg: '#f6f9fc',
  bgSecondary: '#eaf0f7',
  surface: '#ffffff',
  text: '#26251e',
  muted: '#807d72',
  orange: '#533afd',
  orangeHover: '#3f28e0',
  border: '#e6e5e0',
  success: '#1f8a65',
  error: '#cf2d56',
  warning: '#c08532',
} as const

export const ALL_STATUSES = [
  'New',
  'Triaged',
  'InProgress',
  'WaitingOnCustomer',
  'WaitingOnInternal',
  'Escalated',
  'Resolved',
  'Closed',
] as const

export const ALL_PRIORITIES = ['Urgent', 'High', 'Medium', 'Low'] as const

export const ALL_CATEGORIES = [
  'Billing',
  'Bug',
  'FeatureRequest',
  'Account',
  'Access',
  'Hardware',
  'Other',
] as const

export const SOURCE_CHANNELS = ['Email', 'InApp', 'Slack', 'Phone', 'WalkUp'] as const

export const PLAN_TIERS = ['Free', 'Pro', 'Business', 'Enterprise'] as const

export function statusLabel(status: string): string {
  switch (status) {
    case 'InProgress':
      return 'In Progress'
    case 'WaitingOnCustomer':
      return 'Waiting on Customer'
    case 'WaitingOnInternal':
      return 'Waiting on Internal'
    default:
      return status
  }
}

export function statusBadgeStyle(status: string): CSSProperties {
  switch (status) {
    case 'InProgress':
      return { backgroundColor: 'rgba(168,200,240,0.30)', color: C.text }
    case 'WaitingOnCustomer':
    case 'WaitingOnInternal':
      return { backgroundColor: 'rgba(232,212,160,0.40)', color: C.text }
    case 'Escalated':
      return { backgroundColor: 'rgba(200,184,240,0.30)', color: C.text }
    case 'Resolved':
      return { backgroundColor: 'rgba(168,220,200,0.40)', color: C.success }
    case 'Closed':
      return { backgroundColor: C.bgSecondary, color: C.muted }
    case 'Triaged':
      return { backgroundColor: '#e6e5e0', color: C.text }
    case 'New':
    default:
      return { backgroundColor: C.bgSecondary, color: C.text }
  }
}

export function priorityBadgeStyle(priority: string): CSSProperties {
  switch (priority) {
    case 'Urgent':
      return { backgroundColor: 'rgba(207,45,86,0.08)', color: C.error }
    case 'High':
      return { backgroundColor: 'rgba(192,133,50,0.15)', color: C.warning }
    case 'Medium':
      return { backgroundColor: 'rgba(128,125,114,0.12)', color: C.text }
    case 'Low':
    default:
      return { backgroundColor: C.bgSecondary, color: C.muted }
  }
}

export function slaHoursForPriority(priority: string): number {
  switch (priority) {
    case 'Urgent':
      return 1
    case 'High':
      return 4
    case 'Medium':
      return 8
    case 'Low':
    default:
      return 24
  }
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const diffMs = Date.now() - d.getTime()
  const mins = Math.round(diffMs / 60000)
  if (Math.abs(mins) < 60) return mins <= 0 ? 'just now' : `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (Math.abs(hours) < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

export type SlaTone = 'ok' | 'warn' | 'overdue' | 'none'

export function slaCountdown(
  slaDueAt: string | null | undefined,
  status: string,
): { text: string; tone: SlaTone } {
  if (status === 'Resolved' || status === 'Closed') return { text: 'Closed', tone: 'none' }
  if (!slaDueAt) return { text: 'No SLA', tone: 'none' }
  const due = new Date(slaDueAt).getTime()
  if (Number.isNaN(due)) return { text: 'No SLA', tone: 'none' }
  const diffMs = due - Date.now()
  const abs = Math.abs(diffMs)
  const h = Math.floor(abs / 3600000)
  const m = Math.floor((abs % 3600000) / 60000)
  const span = h > 0 ? `${h}h ${m}m` : `${m}m`
  if (diffMs < 0) return { text: `Overdue ${span}`, tone: 'overdue' }
  if (diffMs < 2 * 3600000) return { text: `Due in ${span}`, tone: 'warn' }
  return { text: `Due in ${span}`, tone: 'ok' }
}

// Stripe-themed chart palette (solid, legible versions of the brand pastels).
export const CHART = {
  orange: '#533afd',
  ink: '#26251e',
  blue: '#6ba3e5',
  gold: '#d3ac57',
  purple: '#a888e6',
  green: '#3fae8b',
  rose: '#dd6f8c',
  muted: '#b8b6ac',
} as const

export const CHART_SERIES = [
  CHART.orange,
  CHART.blue,
  CHART.green,
  CHART.purple,
  CHART.gold,
  CHART.rose,
] as const

export function chartStatusColor(status: string): string {
  switch (status) {
    case 'New':
      return CHART.muted
    case 'Triaged':
      return '#c9b98f'
    case 'InProgress':
      return CHART.blue
    case 'WaitingOnCustomer':
      return CHART.gold
    case 'WaitingOnInternal':
      return '#e0c98a'
    case 'Escalated':
      return CHART.purple
    case 'Resolved':
      return CHART.green
    case 'Closed':
      return '#a8a69c'
    default:
      return CHART.muted
  }
}

export function slaToneColor(tone: SlaTone): string {
  switch (tone) {
    case 'overdue':
      return C.error
    case 'warn':
      return C.warning
    case 'ok':
      return C.success
    default:
      return C.muted
  }
}
