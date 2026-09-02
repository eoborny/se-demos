import { coerceRole, DraftRow, audit, evaluateSensitivity, SLACK_APPROVAL_CHANNEL } from './shared'

type Params = { threshold: number; repName?: string; actor: string; role: string }

// Manager bulk-approves pending drafts above a confidence threshold.
// Sensitive drafts (rule matches) are skipped and routed instead of sent.
export default async function bulkApprove(req: { params: Params }) {
  const role = coerceRole(req.params.role)
  if (role !== 'manager' && role !== 'admin') throw new Error('Only managers can bulk-approve')

  const repFilter = req.params.repName && req.params.repName !== 'all' ? req.params.repName : 'all'
  const res = await retoolDb.query<DraftRow>(
    `SELECT * FROM sdr_drafts WHERE status = 'Pending Review' AND confidence >= $1 AND ($2 = 'all' OR rep_name = $2)`,
    [req.params.threshold, repFilter]
  )

  let approved = 0
  let skipped = 0
  for (const draft of res.data) {
    const check = await evaluateSensitivity({ content: draft.current_content, accountTier: draft.account_tier })
    if (check.sensitive) {
      await retoolDb.query(
        `UPDATE sdr_drafts SET status = 'Pending Sensitive-Content Approval', sensitive = true, sensitive_reason = $1, approver = $2, updated_at = now() WHERE id = $3`,
        [check.reason, check.approver, draft.id]
      )
      await audit({ draftId: draft.id, accountName: draft.account_name, actor: req.params.actor, actorRole: role, action: 'route', before: draft.status, after: 'Pending Sensitive-Content Approval', detail: `Bulk skip — ${check.reason}` })
      skipped++
    } else {
      await retoolDb.query(`UPDATE sdr_drafts SET status = 'Approved', updated_at = now() WHERE id = $1`, [draft.id])
      await audit({ draftId: draft.id, accountName: draft.account_name, actor: req.params.actor, actorRole: role, action: 'approve', before: draft.status, after: 'Approved', detail: `Bulk-approved (confidence >= ${req.params.threshold})` })
      approved++
    }
  }

  // One Slack summary instead of a message per draft, to avoid noise.
  if (approved > 0) {
    try {
      const scope = repFilter === 'all' ? 'the team' : repFilter
      const lines = [
        `:white_check_mark: *${approved} outreach draft${approved === 1 ? '' : 's'} bulk-approved* for ${scope}`,
        `*Confidence threshold:* ${Math.round(req.params.threshold * 100)}%  ·  *Approved by:* ${req.params.actor}`,
        skipped > 0 ? `:warning: ${skipped} routed to sensitive-content approval instead.` : null,
      ].filter(Boolean) as string[]
      await workflowsDemoSlack.chat.postMessage({ channel: SLACK_APPROVAL_CHANNEL, text: lines.join('\n'), mrkdwn: true })
    } catch {
      // best-effort
    }
  }

  return { approved, skipped }
}
