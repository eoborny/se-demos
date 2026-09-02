import { coerceRole, audit } from './shared'

type Params = { id: number; enabled: boolean; name: string; actor: string; role: string }

// Enable or disable a routing rule (admin only).
export default async function toggleRoutingRule(req: { params: Params }) {
  const role = coerceRole(req.params.role)
  if (role !== 'admin') throw new Error('Only admins can edit routing rules')
  await retoolDb.query(`UPDATE sdr_routing_rules SET enabled = $1 WHERE id = $2`, [req.params.enabled, req.params.id])
  await audit({
    actor: req.params.actor, actorRole: role, action: 'config',
    detail: `${req.params.enabled ? 'Enabled' : 'Disabled'} routing rule "${req.params.name}"`,
  })
  return { id: req.params.id, enabled: req.params.enabled }
}
