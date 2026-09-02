// Shared frontend types and config for the Outreach Review Console.

export type Role = 'rep' | 'manager' | 'approver' | 'admin' | 'revops'

export type Persona = {
  name: string
  role: Role
  roleLabel: string
  title: string
}

// Demo personas — stands in for SSO group mapping (PRD §5 / §8).
export const PERSONAS: Persona[] = [
  { name: 'Jordan Lee', role: 'rep', roleLabel: 'SDR / Rep', title: 'Sales Development Rep' },
  { name: 'Alex Rivera', role: 'manager', roleLabel: 'SDR Manager', title: 'SDR Team Manager' },
  { name: 'Dana Whitfield', role: 'approver', roleLabel: 'Sensitive-content Approver', title: 'Compliance Reviewer' },
  { name: 'Sam Okafor', role: 'admin', roleLabel: 'Admin', title: 'Sales Systems Admin' },
  { name: 'Taylor Brooks', role: 'revops', roleLabel: 'Enablement / RevOps', title: 'RevOps Analyst' },
]

export type DraftStatus =
  | 'Pending Review'
  | 'Approved'
  | 'Edited & Approved'
  | 'Rejected'
  | 'Pending Sensitive-Content Approval'
  | 'Sent'

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'warning' | 'success' | 'outline'

export const STATUS_META: Record<string, { label: string; variant: BadgeVariant }> = {
  'Pending Review': { label: 'Pending Review', variant: 'secondary' },
  'Approved': { label: 'Approved', variant: 'success' },
  'Edited & Approved': { label: 'Edited & Approved', variant: 'success' },
  'Rejected': { label: 'Rejected', variant: 'destructive' },
  'Pending Sensitive-Content Approval': { label: 'Pending Sensitive Approval', variant: 'warning' },
  'Sent': { label: 'Sent', variant: 'default' },
}

export const REASON_CODES = [
  'Off-brand',
  'Factually wrong',
  'Wrong tone',
  'Not relevant',
  'Other',
] as const

export const PRIORITY_META: Record<string, BadgeVariant> = {
  High: 'destructive',
  Medium: 'warning',
  Low: 'secondary',
}

export const OUTREACH_TYPES = ['Email', 'LinkedIn', 'Call Script'] as const

export const REPS = ['Jordan Lee', 'Priya Shah', 'Marcus Chen'] as const

export type Draft = {
  id: number
  account_name: string
  account_tier: string
  contact_name: string
  contact_title: string | null
  rep_name: string
  outreach_type: string
  sequence_step: string | null
  priority: string
  status: string
  subject: string | null
  ai_original: string
  current_content: string
  confidence: number
  research: {
    firmographics: string[]
    recent_news: string[]
    intent_signals: string[]
    thread_history: string[]
  }
  sensitive: boolean
  sensitive_reason: string | null
  reason_code: string | null
  approver: string | null
  approver_comment: string | null
  created_at: string
  updated_at: string
  playbook_version_id: number | null
  playbook_version_number: number | null
  playbook_name: string | null
  experiment_id: number | null
  experiment_variant_id: number | null
}

export type ExperimentStatus = 'draft' | 'running' | 'completed' | 'stopped'

export const EXPERIMENT_STATUS_META: Record<string, { label: string; variant: BadgeVariant }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  running: { label: 'Running', variant: 'success' },
  completed: { label: 'Completed', variant: 'default' },
  stopped: { label: 'Stopped', variant: 'outline' },
}

export type ExperimentVariantSummary = {
  experiment_id: number
  id: number
  label: string
  playbook_version_id: number
  version_number: number
  traffic_split: number
  draft_count: number
}

export type Experiment = {
  id: number
  playbook_id: number
  name: string
  hypothesis: string | null
  status: ExperimentStatus
  created_by: string
  created_at: string
  started_at: string | null
  ended_at: string | null
  variants: ExperimentVariantSummary[]
}

export type ExperimentVariantResult = {
  id: number
  label: string
  traffic_split: number
  playbook_version_id: number
  version_number: number
  drafts: number
  approved_no_edit: number
  overridden: number
  sent: number
  replied: number
  approval_no_edit_rate: number | null
  override_rate: number | null
  reply_rate: number | null
  reply_pending: boolean
}

export type ExperimentComparison = {
  leaderLabel: string
  baselineLabel: string
  leaderRate: number
  baselineRate: number
  relativeLift: number | null
  zScore: number | null
  confidence: number | null
  significant: boolean
  enoughData: boolean
  minSent: number
  summary: string
}

export const OUTCOME_TYPES = ['sent', 'replied', 'bounced', 'opted_out'] as const

export type Playbook = {
  id: number
  name: string
  outreach_type: string
  created_by: string
  created_at: string
  version_count: number
  active_version_number: number | null
  total_drafts: number
  override_rate: number | null
}

export type PlaybookVersionStatus = 'draft' | 'active' | 'retired'

export type VersionAnalytics = {
  id: number
  playbook_id: number
  version_number: number
  prompt_text: string
  change_notes: string
  created_by: string
  created_at: string
  status: PlaybookVersionStatus
  draft_count: number
  overridden_count: number
  override_rate: number | null
  reasons: { reason: string; count: number }[]
  delta: { prev_version_number: number | null; value: number | null; enough_data: boolean }
}

export const VERSION_STATUS_META: Record<string, { label: string; variant: BadgeVariant }> = {
  active: { label: 'Active', variant: 'success' },
  draft: { label: 'Draft', variant: 'secondary' },
  retired: { label: 'Retired', variant: 'outline' },
  legacy: { label: 'Legacy', variant: 'outline' },
}

export function formatPct(v: number | null | undefined, digits = 0): string {
  if (v == null) return '—'
  return `${(v * 100).toFixed(digits)}%`
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const diffMs = Date.now() - then
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  return `${days}d ago`
}
