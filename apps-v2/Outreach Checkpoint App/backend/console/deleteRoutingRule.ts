import { coerceRole, audit } from './shared'

type Params = { id: number; name: string; actor: string; role: string }

// Delete a routing rule (admin only).
export default async function deleteRoutingRule(req: { params: Params }) {
  const role = coerceRole(req.params.role)
  if (role !== 'admin') throw new Error('Only admins can delete routing rules')
  await retoolDb.query(`DELETE FROM sdr_routing_rules WHERE id = $1`, [req.params.id])
  await audit({ actor: req.params.actor, actorRole: role, action: 'config', detail: `Deleted routing rule "${req.params.name}"` })
  return { id: req.params.id }
}
