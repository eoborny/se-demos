import { coerceRole, DraftRow, audit } from './shared'

type Params = { id: number; actor: string; role: string }

// Fetch a single draft and log the view action.
export default async function getDraft(req: { params: Params }) {
  const role = coerceRole(req.params.role)
  const result = await retoolDb.query<DraftRow>(
    `SELECT d.*, pv.version_number AS playbook_version_number, pb.name AS playbook_name
     FROM sdr_drafts d
     LEFT JOIN sdr_playbook_versions pv ON d.playbook_version_id = pv.id
     LEFT JOIN sdr_playbooks pb ON pv.playbook_id = pb.id
     WHERE d.id = $1`,
    [req.params.id]
  )
  const draft = result.data[0]
  if (!draft) throw new Error('Draft not found')

  await audit({
    draftId: draft.id,
    accountName: draft.account_name,
    actor: req.params.actor,
    actorRole: role,
    action: 'view',
    detail: 'Opened draft for review',
  })

  return draft
}
