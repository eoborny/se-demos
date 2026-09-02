import { coerceRole, DraftRow, audit } from './shared'

type Params = { id: number; newRep: string; actor: string; role: string }

// Manager reassigns a draft to a different rep.
export default async function reassignDraft(req: { params: Params }) {
  const role = coerceRole(req.params.role)
  if (role !== 'manager' && role !== 'admin') throw new Error('Only managers can reassign drafts')

  const res = await retoolDb.query<DraftRow>(`SELECT * FROM sdr_drafts WHERE id = $1`, [req.params.id])
  const draft = res.data[0]
  if (!draft) throw new Error('Draft not found')

  await retoolDb.query(`UPDATE sdr_drafts SET rep_name = $1, updated_at = now() WHERE id = $2`, [req.params.newRep, draft.id])
  await audit({
    draftId: draft.id, accountName: draft.account_name, actor: req.params.actor, actorRole: role,
    action: 'reassign', before: draft.rep_name, after: req.params.newRep, detail: `Reassigned to ${req.params.newRep}`,
  })
  return { rep_name: req.params.newRep }
}
