import { coerceRole, DraftRow, audit, evaluateSensitivity, notifyDraftApproved } from './shared'

type Params = { id: number; newContent: string; actor: string; role: string }

// Rep edits a draft in-place then approves. Stores a before/after override diff,
// re-evaluates routing rules, and routes to an approver if a rule now matches.
export default async function editApproveDraft(req: { params: Params }) {
  const role = coerceRole(req.params.role)
  const res = await retoolDb.query<DraftRow>(`SELECT * FROM sdr_drafts WHERE id = $1`, [req.params.id])
  const draft = res.data[0]
  if (!draft) throw new Error('Draft not found')

  const before = draft.current_content
  const after = req.params.newContent
  const changed = before.trim() !== after.trim()

  // Record the override (before/after diff) for pattern analytics
  if (changed) {
    await retoolDb.query(
      `INSERT INTO sdr_overrides (draft_id, account_name, account_segment, outreach_type, rep_name, type, before_content, after_content, actor)
       VALUES ($1,$2,$3,$4,$5,'edit',$6,$7,$8)`,
      [draft.id, draft.account_name, draft.account_tier, draft.outreach_type, draft.rep_name, before, after, req.params.actor]
    )
  }

  const check = await evaluateSensitivity({ content: after, accountTier: draft.account_tier })
  const alreadyCleared = draft.approver_comment != null && draft.status.startsWith('Pending Sensitive')

  if (check.sensitive && !alreadyCleared) {
    await retoolDb.query(
      `UPDATE sdr_drafts SET current_content = $1, status = 'Pending Sensitive-Content Approval', sensitive = true, sensitive_reason = $2, approver = $3, updated_at = now() WHERE id = $4`,
      [after, check.reason, check.approver, draft.id]
    )
    await audit({
      draftId: draft.id, accountName: draft.account_name, actor: req.params.actor, actorRole: role,
      action: 'edit', before: draft.status, after: 'Pending Sensitive-Content Approval', detail: 'Edited then routed for sensitive-content review',
    })
    return { status: 'Pending Sensitive-Content Approval', routed: true, reason: check.reason }
  }

  await retoolDb.query(
    `UPDATE sdr_drafts SET current_content = $1, status = 'Edited & Approved', updated_at = now() WHERE id = $2`,
    [after, draft.id]
  )
  await audit({
    draftId: draft.id, accountName: draft.account_name, actor: req.params.actor, actorRole: role,
    action: 'edit', before: draft.status, after: 'Edited & Approved', detail: changed ? 'Edited and approved' : 'Approved without changes',
  })
  await notifyDraftApproved({ draft: { ...draft, current_content: after }, approver: req.params.actor, statusLabel: 'Edited & Approved' })
  return { status: 'Edited & Approved', routed: false }
}
