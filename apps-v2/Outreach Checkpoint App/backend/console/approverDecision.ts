import { coerceRole, DraftRow, audit, notifyDraftApproved } from './shared'

type Params = { id: number; decision: 'approve' | 'reject'; comment?: string; reasonCode?: string; actor: string; role: string }

// Sensitive-content approver approves or rejects a routed draft, with an optional comment.
export default async function approverDecision(req: { params: Params }) {
  const role = coerceRole(req.params.role)
  if (role !== 'approver' && role !== 'admin') throw new Error('Only approvers can decide on sensitive drafts')

  const res = await retoolDb.query<DraftRow>(`SELECT * FROM sdr_drafts WHERE id = $1`, [req.params.id])
  const draft = res.data[0]
  if (!draft) throw new Error('Draft not found')

  const comment = req.params.comment ?? null

  if (req.params.decision === 'approve') {
    await retoolDb.query(
      `UPDATE sdr_drafts SET status = 'Approved', approver_comment = $1, updated_at = now() WHERE id = $2`,
      [comment, draft.id]
    )
    await audit({
      draftId: draft.id, accountName: draft.account_name, actor: req.params.actor, actorRole: role,
      action: 'approve', before: draft.status, after: 'Approved', detail: comment ? `Comment: ${comment}` : 'Sensitive-content approved',
    })
    await notifyDraftApproved({ draft, approver: req.params.actor, statusLabel: 'Approved (sensitive-content cleared)' })
    return { status: 'Approved' }
  }

  const reason = req.params.reasonCode ?? 'Compliance hold'
  await retoolDb.query(
    `UPDATE sdr_drafts SET status = 'Rejected', reason_code = $1, approver_comment = $2, updated_at = now() WHERE id = $3`,
    [reason, comment, draft.id]
  )
  await retoolDb.query(
    `INSERT INTO sdr_overrides (draft_id, account_name, account_segment, outreach_type, rep_name, type, reason_code, before_content, actor)
     VALUES ($1,$2,$3,$4,$5,'reject',$6,$7,$8)`,
    [draft.id, draft.account_name, draft.account_tier, draft.outreach_type, draft.rep_name, reason, draft.current_content, req.params.actor]
  )
  await audit({
    draftId: draft.id, accountName: draft.account_name, actor: req.params.actor, actorRole: role,
    action: 'reject', before: draft.status, after: 'Rejected', detail: comment ? `${reason} — ${comment}` : reason,
  })
  return { status: 'Rejected' }
}
