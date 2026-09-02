import { coerceRole, audit } from './shared'

type Params = {
  id?: number
  name: string
  ruleType: string
  pattern: string
  approver: string
  enabled: boolean
  description?: string
  actor: string
  role: string
}

// Create or update a routing rule (admin only).
export default async function saveRoutingRule(req: { params: Params }) {
  const role = coerceRole(req.params.role)
  if (role !== 'admin') throw new Error('Only admins can edit routing rules')
  const p = req.params

  if (p.id) {
    await retoolDb.query(
      `UPDATE sdr_routing_rules SET name = $1, rule_type = $2, pattern = $3, approver = $4, enabled = $5, description = $6 WHERE id = $7`,
      [p.name, p.ruleType, p.pattern, p.approver, p.enabled, p.description ?? null, p.id]
    )
    await audit({ actor: p.actor, actorRole: role, action: 'config', detail: `Updated routing rule "${p.name}"` })
    return { id: p.id }
  }

  const res = await retoolDb.query<{ id: number }>(
    `INSERT INTO sdr_routing_rules (name, rule_type, pattern, approver, enabled, description)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [p.name, p.ruleType, p.pattern, p.approver, p.enabled, p.description ?? null]
  )
  await audit({ actor: p.actor, actorRole: role, action: 'config', detail: `Created routing rule "${p.name}"` })
  return { id: res.data[0]?.id }
}
