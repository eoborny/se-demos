import { coerceRole, audit } from './shared'

type Params = { experimentId: number; actor: string; role: string }

// Stops an experiment early: freezes variant assignment (assignment only runs while
// status = 'running') but outcome data keeps flowing for already-sent drafts.
export default async function stopExperiment(req: { params: Params }) {
  const role = coerceRole(req.params.role)
  if (role !== 'admin' && role !== 'manager') throw new Error('Only managers or admins can stop experiments')

  const exp = await retoolDb.query<{ name: string; status: string }>(
    `SELECT name, status FROM sdr_experiments WHERE id = $1`, [req.params.experimentId]
  )
  const e = exp.data[0]
  if (!e) throw new Error('Experiment not found')
  if (e.status !== 'running') throw new Error('Only a running experiment can be stopped')

  await retoolDb.query(`UPDATE sdr_experiments SET status = 'stopped', ended_at = now() WHERE id = $1`, [req.params.experimentId])
  await audit({ actor: req.params.actor, actorRole: role, action: 'config', detail: `Stopped experiment "${e.name}"` })
  return { status: 'stopped' }
}
