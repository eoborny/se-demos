import { coerceRole, DraftRow, audit } from './shared'

type Params = { id: number; actor: string; role: string }

// Hand an approved draft off to the existing send system (marks it Sent).
export default async function sendDraft(req: { params: Params }) {
  const role = coerceRole(req.params.role)
  const res = await retoolDb.query<DraftRow>(`SELECT * FROM sdr_drafts WHERE id = $1`, [req.params.id])
  const draft = res.data[0]
  if (!draft) throw new Error('Draft not found')
  if (draft.status !== 'Approved' && draft.status !== 'Edited & Approved') {
    throw new Error('Only approved drafts can be sent')
  }

  await retoolDb.query(`UPDATE sdr_drafts SET status = 'Sent', updated_at = now() WHERE id = $1`, [draft.id])
  await audit({
    draftId: draft.id, accountName: draft.account_name, actor: req.params.actor, actorRole: role,
    action: 'send', before: draft.status, after: 'Sent', detail: 'Handed off to sequencing tool',
  })
  return { status: 'Sent' }
}
