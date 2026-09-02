import { coerceRole, DraftRow, audit } from './shared'

type Params = { id: number; content: string; actor: string; role: string }

// Persists AI-regenerated (or otherwise replaced) draft body without changing the
// draft's review status. Logs the change to the audit trail.
export default async function updateDraftContent(req: { params: Params }) {
  const role = coerceRole(req.params.role)
  const p = req.params
  if (!p.content || !p.content.trim()) throw new Error('Content is required')

  const res = await retoolDb.query<DraftRow>(`SELECT * FROM sdr_drafts WHERE id = $1`, [p.id])
  const draft = res.data[0]
  if (!draft) throw new Error('Draft not found')

  await retoolDb.query(
    `UPDATE sdr_drafts SET current_content = $1, updated_at = now() WHERE id = $2`,
    [p.content, p.id]
  )
  await audit({
    draftId: draft.id, accountName: draft.account_name, actor: p.actor, actorRole: role,
    action: 'edit', before: draft.status, after: draft.status, detail: 'Applied AI regeneration',
  })

  return { ok: true }
}
