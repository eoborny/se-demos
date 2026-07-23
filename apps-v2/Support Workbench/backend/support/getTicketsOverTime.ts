import { rangeDays, typeClauseSql, typeParams } from './analytics'

type Params = { dateRange?: string; ticketType?: string }

export default async function getTicketsOverTime(req: { params: Params; user: User }) {
  const p = req.params ?? {}
  const days = rangeDays(p.dateRange)
  const tp = typeParams(p.ticketType)

  const result = await retoolDb.query<{
    date: string
    created: number
    resolved: number
    open: number
  }>(
    `WITH span AS (
       SELECT generate_series(
         (CURRENT_DATE - ($1::int - 1)),
         CURRENT_DATE,
         INTERVAL '1 day'
       )::date AS d
     )
     SELECT
       to_char(span.d, 'YYYY-MM-DD') AS date,
       (SELECT COUNT(*)::int FROM support_tickets t
          WHERE t.created_at::date = span.d` + typeClauseSql(2) + `) AS created,
       (SELECT COUNT(*)::int FROM support_tickets t
          WHERE t.resolved_at::date = span.d` + typeClauseSql(4) + `) AS resolved,
       (SELECT COUNT(*)::int FROM support_tickets t
          WHERE t.created_at::date <= span.d
            AND (t.resolved_at IS NULL OR t.resolved_at::date > span.d)` + typeClauseSql(6) + `) AS open
     FROM span
     ORDER BY span.d`,
    [days, ...tp, ...tp, ...tp],
  )

  return result.data
}
