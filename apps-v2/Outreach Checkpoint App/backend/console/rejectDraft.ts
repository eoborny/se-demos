import { coerceRole, DraftRow, audit } from './shared'

type Params = { id: number; reasonCode: string; actor: string; role: string }

// Rep rejects a draft with a reason code; recorded as an override for analytics.
export default async function rejectDraft(req: { params: Params }) {
  const role = coerceRole(req.params.role)
  const res = await retoolDb.query<DraftRow>(`SELECT * FROM sdr_drafts WHERE id = $1`, [req.params.id])
  const draft = res.data[0]
  if (!draft) throw new Error('Draft not found')

  await retoolDb.query(
    `UPDATE sdr_drafts SET status = 'Rejected', reason_code = $1, updated_at = now() WHERE id = $2`,
    [req.params.reasonCode, draft.id]
  )
  await retoolDb.query(
    `INSERT INTO sdr_overrides (draft_id, account_name, account_segment, outreach_type, rep_name, type, reason_code, before_content, actor)
     VALUES ($1,$2,$3,$4,$5,'reject',$6,$7,$8)`,
    [draft.id, draft.account_name, draft.account_tier, draft.outreach_type, draft.rep_name, req.params.reasonCode, draft.current_content, req.params.actor]
  )
  await audit({
    draftId: draft.id, accountName: draft.account_name, actor: req.params.actor, actorRole: role,
    action: 'reject', before: draft.status, after: 'Rejected', detail: `Reason: ${req.params.reasonCode}`,
  })
  return { status: 'Rejected' }
}
