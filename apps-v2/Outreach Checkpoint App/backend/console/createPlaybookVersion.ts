import { coerceRole, audit } from './shared'

type Params = { playbookId: number; promptText: string; changeNotes: string; actor: string; role: string }

// Creating a new version never overwrites — it inserts a new draft version with an
// incremented version_number and required change notes.
export default async function createPlaybookVersion(req: { params: Params }) {
  const role = coerceRole(req.params.role)
  if (role !== 'admin' && role !== 'manager') throw new Error('Only managers or admins can edit playbooks')
  const p = req.params
  if (!p.promptText || !p.promptText.trim()) throw new Error('Prompt text is required')
  if (!p.changeNotes || !p.changeNotes.trim()) throw new Error('Change notes are required')

  const pb = await retoolDb.query<{ name: string }>(`SELECT name FROM sdr_playbooks WHERE id = $1`, [p.playbookId])
  if (!pb.data[0]) throw new Error('Playbook not found')

  const maxRes = await retoolDb.query<{ max: number | null }>(
    `SELECT MAX(version_number) AS max FROM sdr_playbook_versions WHERE playbook_id = $1`,
    [p.playbookId]
  )
  const nextNum = (maxRes.data[0]?.max ?? 0) + 1

  const res = await retoolDb.query<{ id: number }>(
    `INSERT INTO sdr_playbook_versions (playbook_id, version_number, prompt_text, change_notes, created_by, status)
     VALUES ($1, $2, $3, $4, $5, 'draft') RETURNING id`,
    [p.playbookId, nextNum, p.promptText.trim(), p.changeNotes.trim(), p.actor]
  )

  await audit({
    actor: p.actor, actorRole: role, action: 'config',
    detail: `Created v${nextNum} of playbook "${pb.data[0].name}" (draft)`,
  })

  return { id: res.data[0]?.id, version_number: nextNum, status: 'draft' }
}
