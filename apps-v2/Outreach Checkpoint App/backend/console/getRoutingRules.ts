import { RoutingRule } from './shared'

// Returns all sensitive-content routing rules (admin config surface).
export default async function getRoutingRules(_req: { params: Record<string, never> }) {
  const result = await retoolDb.query<RoutingRule>(`SELECT * FROM sdr_routing_rules ORDER BY id ASC`)
  return result.data
}
