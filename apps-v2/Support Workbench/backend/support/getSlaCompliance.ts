import { rangeDays, typeClauseSql, typeParams } from './analytics'

type Params = { dateRange?: string; ticketType?: string }

export default async function getSlaCompliance(req: { params: Params; user: User }) {
  const p = req.params ?? {}
  const days = rangeDays(p.dateRange)
  const tp = typeParams(p.ticketType)

  const result = await retoolDb.query<{ total: number; met: number }>(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE resolved_at <= sla_due_at)::int AS met
     FROM support_tickets
     WHERE resolved_at IS NOT NULL
       AND sla_due_at IS NOT NULL
       AND resolved_at >= NOW() - INTERVAL '1 day' * $1::int` + typeClauseSql(2),
    [days, ...tp],
  )

  const total = result.data[0]?.total ?? 0
  const met = result.data[0]?.met ?? 0
  const pct = total > 0 ? Math.round((met / total) * 100) : null

  return { total, met, breached: total - met, pct, range_days: days }
}
