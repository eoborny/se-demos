import { coerceRole, audit } from './shared'

type Params = { playbookId: number; versionId: number; actor: string; role: string }

// Activates a version: retires the current active version first (so the DB's
// one-active-per-playbook constraint is never violated), then activates the target.
// Reactivating a retired version is a rollback — no special path needed.
export default async function activatePlaybookVersion(req: { params: Params }) {
  const role = coerceRole(req.params.role)
  if (role !== 'admin' && role !== 'manager') throw new Error('Only managers or admins can activate playbook versions')
  const { playbookId, versionId, actor } = req.params

  const target = await retoolDb.query<{ version_number: number; status: string }>(
    `SELECT version_number, status FROM sdr_playbook_versions WHERE id = $1 AND playbook_id = $2`,
    [versionId, playbookId]
  )
  const tv = target.data[0]
  if (!tv) throw new Error('Version not found for this playbook')
  if (tv.status === 'active') return { versionId, status: 'active', unchanged: true }

  // Retire the current active version (if any) BEFORE activating the target.
  await retoolDb.query(
    `UPDATE sdr_playbook_versions SET status = 'retired' WHERE playbook_id = $1 AND status = 'active'`,
    [playbookId]
  )
  await retoolDb.query(`UPDATE sdr_playbook_versions SET status = 'active' WHERE id = $1`, [versionId])

  const pb = await retoolDb.query<{ name: string }>(`SELECT name FROM sdr_playbooks WHERE id = $1`, [playbookId])
  await audit({
    actor, actorRole: role, action: 'config',
    detail: `Activated v${tv.version_number} of playbook "${pb.data[0]?.name ?? ''}"`,
  })

  return { versionId, status: 'active', unchanged: false }
}
