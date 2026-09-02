// Shared types and helpers for the AI Outreach Review Console backend.

export type Role = 'rep' | 'manager' | 'approver' | 'admin' | 'revops'

export const ROLE_LABELS: Record<Role, string> = {
  rep: 'SDR / Rep',
  manager: 'SDR Manager',
  approver: 'Sensitive-content Approver',
  admin: 'Admin',
  revops: 'Enablement / RevOps',
}

export const APPROVER_NAME = 'Dana Whitfield'

// Slack channel that receives outreach-approval notifications.
export const SLACK_APPROVAL_CHANNEL = 'C047TSRLGMV'

// Minimum number of drafts a version needs before we show an override-rate delta.
export const MIN_SAMPLE_SIZE = 25

// Minimum sent drafts per variant before an A/B winner can be declared.
export const MIN_SENT_PER_VARIANT = 30

export type Experiment = {
  id: number
  playbook_id: number
  name: string
  hypothesis: string | null
  status: 'draft' | 'running' | 'completed' | 'stopped'
  created_by: string
  created_at: string
  started_at: string | null
  ended_at: string | null
}

export type ExperimentVariant = {
  id: number
  experiment_id: number
  playbook_version_id: number
  label: string
  traffic_split: number
}

export type Playbook = {
  id: number
  name: string
  outreach_type: string
  created_by: string
  created_at: string
}

export type PlaybookVersion = {
  id: number
  playbook_id: number
  version_number: number
  prompt_text: string
  change_notes: string
  created_by: string
  created_at: string
  status: 'draft' | 'active' | 'retired'
}

export type ResearchBlob = {
  firmographics: string[]
  recent_news: string[]
  intent_signals: string[]
  thread_history: string[]
}

export type DraftRow = {
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
  research: ResearchBlob
  sensitive: boolean
  sensitive_reason: string | null
  reason_code: string | null
  approver: string | null
  approver_comment: string | null
  created_at: string
  updated_at: string
  playbook_version_id: number | null
  // populated by joins in getDrafts / getDraft
  playbook_version_number?: number | null
  playbook_name?: string | null
}

export type RoutingRule = {
  id: number
  name: string
  rule_type: string
  pattern: string
  approver: string
  enabled: boolean
  description: string | null
  created_at: string
}

export type Actor = { name: string; role: Role }

// Write an entry to the audit log. Best-effort; never throws to the caller.
export async function audit(entry: {
  draftId?: number | null
  accountName?: string | null
  actor: string
  actorRole: Role
  action: string
  before?: string | null
  after?: string | null
  detail?: string | null
}): Promise<void> {
  try {
    await retoolDb.query(
      `INSERT INTO sdr_audit_log (draft_id, account_name, actor, actor_role, action, before_state, after_state, detail)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        entry.draftId ?? null,
        entry.accountName ?? null,
        entry.actor,
        ROLE_LABELS[entry.actorRole],
        entry.action,
        entry.before ?? null,
        entry.after ?? null,
        entry.detail ?? null,
      ]
    )
  } catch {
    // swallow — auditing must not break the primary action
  }
}

// Post an approval notification to Slack. Best-effort; never throws to the caller
// so a Slack outage can't block a draft approval.
export async function notifyDraftApproved(entry: {
  draft: DraftRow
  approver: string
  statusLabel: string
}): Promise<void> {
  try {
    const { draft, approver, statusLabel } = entry
    const lines = [
      `:white_check_mark: *Outreach approved* — ${draft.account_name}`,
      `*Contact:* ${draft.contact_name}${draft.contact_title ? `, ${draft.contact_title}` : ''}`,
      `*Rep:* ${draft.rep_name}  ·  *Type:* ${draft.outreach_type}`,
      draft.subject ? `*Subject:* ${draft.subject}` : null,
      `*Status:* ${statusLabel}  ·  *Approved by:* ${approver}`,
    ].filter(Boolean) as string[]

    await workflowsDemoSlack.chat.postMessage({
      channel: SLACK_APPROVAL_CHANNEL,
      text: lines.join('\n'),
      mrkdwn: true,
    })
  } catch {
    // swallow — notifications must not break the approval action
  }
}

// Evaluate a draft's content against the enabled routing rules.
// Returns the human-readable match reason, or null if nothing matched.
export async function evaluateSensitivity(draft: {
  content: string
  accountTier: string
}): Promise<{ sensitive: boolean; reason: string | null; approver: string | null }> {
  const rules = await retoolDb.query<RoutingRule>(
    `SELECT * FROM sdr_routing_rules WHERE enabled = true`
  )
  const matched: string[] = []
  let approver: string | null = null
  const text = draft.content.toLowerCase()

  for (const rule of rules.data) {
    let hit = false
    if (rule.rule_type === 'keyword') {
      const terms = rule.pattern.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
      const found = terms.filter((t) => t && text.includes(t))
      if (found.length > 0) {
        hit = true
        matched.push(`${rule.name} (${found.join(', ')})`)
      }
    } else if (rule.rule_type === 'account_tier') {
      if (draft.accountTier.toLowerCase() === rule.pattern.trim().toLowerCase()) {
        hit = true
        matched.push(`${rule.name} (${draft.accountTier})`)
      }
    }
    if (hit) approver = rule.approver
  }

  return {
    sensitive: matched.length > 0,
    reason: matched.length > 0 ? `Matched: ${matched.join(', ')}` : null,
    approver,
  }
}

// Normalise a role string coming from the frontend to a valid Role.
export function coerceRole(role: unknown): Role {
  const valid: Role[] = ['rep', 'manager', 'approver', 'admin', 'revops']
  return valid.includes(role as Role) ? (role as Role) : 'rep'
}
