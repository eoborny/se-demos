import { coerceRole, audit } from './shared'
import activatePlaybookVersion from './activatePlaybookVersion'

type Params = { experimentId: number; variantId: number; actor: string; role: string }

// Promotes a winning variant: activates its playbook version through the SAME code path
// as normal version activation, then marks the experiment completed.
export default async function promoteVariant(req: { params: Params }) {
  const role = coerceRole(req.params.role)
  if (role !== 'admin' && role !== 'manager') throw new Error('Only managers or admins can promote a variant')

  const exp = await retoolDb.query<{ playbook_id: number; name: string; status: string }>(
    `SELECT playbook_id, name, status FROM sdr_experiments WHERE id = $1`, [req.params.experimentId]
  )
  const e = exp.data[0]
  if (!e) throw new Error('Experiment not found')

  const variant = await retoolDb.query<{ playbook_version_id: number; label: string }>(
    `SELECT playbook_version_id, label FROM sdr_experiment_variants WHERE id = $1 AND experiment_id = $2`,
    [req.params.variantId, req.params.experimentId]
  )
  const v = variant.data[0]
  if (!v) throw new Error('Variant not found for this experiment')

  // Reuse the standard activate action — no separate activation path.
  await activatePlaybookVersion({
    params: {
      playbookId: e.playbook_id,
      versionId: v.playbook_version_id,
      actor: req.params.actor,
      role: req.params.role,
    },
  })

  await retoolDb.query(
    `UPDATE sdr_experiments SET status = 'completed', ended_at = now() WHERE id = $1`,
    [req.params.experimentId]
  )
  await audit({
    actor: req.params.actor, actorRole: role, action: 'config',
    detail: `Promoted variant ${v.label} and completed experiment "${e.name}"`,
  })

  return { status: 'completed', promotedVariantId: req.params.variantId }
}
