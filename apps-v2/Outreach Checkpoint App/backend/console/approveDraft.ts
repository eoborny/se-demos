import { coerceRole, DraftRow, audit, evaluateSensitivity, notifyDraftApproved } from './shared'

type Params = { id: number; actor: string; role: string }

// Rep approves a draft as-is. Re-evaluates routing rules first: a match sends it
// to the sensitive-content approver instead of straight to Approved.
export default async function approveDraft(req: { params: Params }) {
  const role = coerceRole(req.params.role)
  const res = await retoolDb.query<DraftRow>(`SELECT * FROM sdr_drafts WHERE id = $1`, [req.params.id])
  const draft = res.data[0]
  if (!draft) throw new Error('Draft not found')

  const check = await evaluateSensitivity({ content: draft.current_content, accountTier: draft.account_tier })
  const alreadyCleared = draft.approver_comment != null && draft.status.startsWith('Pending Sensitive')

  if (check.sensitive && !alreadyCleared) {
    await retoolDb.query(
      `UPDATE sdr_drafts SET status = 'Pending Sensitive-Content Approval', sensitive = true, sensitive_reason = $1, approver = $2, updated_at = now() WHERE id = $3`,
      [check.reason, check.approver, draft.id]
    )
    await audit({
      draftId: draft.id, accountName: draft.account_name, actor: req.params.actor, actorRole: role,
      action: 'route', before: draft.status, after: 'Pending Sensitive-Content Approval', detail: check.reason,
    })
    return { status: 'Pending Sensitive-Content Approval', routed: true, reason: check.reason }
  }

  await retoolDb.query(`UPDATE sdr_drafts SET status = 'Approved', updated_at = now() WHERE id = $1`, [draft.id])
  await audit({
    draftId: draft.id, accountName: draft.account_name, actor: req.params.actor, actorRole: role,
    action: 'approve', before: draft.status, after: 'Approved',
  })
  await notifyDraftApproved({ draft, approver: req.params.actor, statusLabel: 'Approved' })
  return { status: 'Approved', routed: false }
}
