import { coerceRole, audit } from './shared'

type Params = { experimentId: number; actor: string; role: string }

// Starts an experiment. One running experiment per playbook is enforced both here
// and by a DB partial-unique index.
export default async function startExperiment(req: { params: Params }) {
  const role = coerceRole(req.params.role)
  if (role !== 'admin' && role !== 'manager') throw new Error('Only managers or admins can start experiments')

  const exp = await retoolDb.query<{ playbook_id: number; name: string; status: string }>(
    `SELECT playbook_id, name, status FROM sdr_experiments WHERE id = $1`, [req.params.experimentId]
  )
  const e = exp.data[0]
  if (!e) throw new Error('Experiment not found')
  if (e.status === 'running') return { status: 'running', unchanged: true }
  if (e.status === 'completed') throw new Error('A completed experiment cannot be restarted')

  const already = await retoolDb.query<{ id: number }>(
    `SELECT id FROM sdr_experiments WHERE playbook_id = $1 AND status = 'running'`, [e.playbook_id]
  )
  if (already.data[0]) throw new Error('Another experiment is already running on this playbook')

  await retoolDb.query(
    `UPDATE sdr_experiments SET status = 'running', started_at = now(), ended_at = NULL WHERE id = $1`,
    [req.params.experimentId]
  )
  await audit({ actor: req.params.actor, actorRole: role, action: 'config', detail: `Started experiment "${e.name}"` })
  return { status: 'running' }
}
