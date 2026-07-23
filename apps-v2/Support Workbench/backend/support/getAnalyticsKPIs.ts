import { rangeDays, typeClauseSql, typeParams } from './analytics'

type Params = { dateRange?: string; ticketType?: string }

export default async function getAnalyticsKPIs(req: { params: Params; user: User }) {
  const p = req.params ?? {}
  const days = rangeDays(p.dateRange)
  const tp = typeParams(p.ticketType)

  const openRes = await retoolDb.query<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM support_tickets
     WHERE status NOT IN ('Resolved', 'Closed')` + typeClauseSql(1),
    tp,
  )

  const slaRes = await retoolDb.query<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM support_tickets
     WHERE sla_due_at < NOW() AND status NOT IN ('Resolved', 'Closed')` + typeClauseSql(1),
    tp,
  )

  const escRes = await retoolDb.query<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM support_tickets
     WHERE status = 'Escalated'` + typeClauseSql(1),
    tp,
  )

  const todayRes = await retoolDb.query<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM support_tickets
     WHERE resolved_at::date = CURRENT_DATE` + typeClauseSql(1),
    tp,
  )

  const resolRes = await retoolDb.query<{ h: string }>(
    `SELECT COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600.0)::numeric, 1), 0) AS h
     FROM support_tickets
     WHERE resolved_at IS NOT NULL
       AND resolved_at >= NOW() - INTERVAL '1 day' * $1::int` + typeClauseSql(2),
    [days, ...tp],
  )

  const frtRes = await retoolDb.query<{ h: string }>(
    `SELECT COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (fn.first_note - t.created_at)) / 3600.0)::numeric, 1), 0) AS h
     FROM support_tickets t
     JOIN (
       SELECT ticket_id, MIN(created_at) AS first_note
       FROM support_ticket_notes GROUP BY ticket_id
     ) fn ON fn.ticket_id = t.id
     WHERE t.created_at >= NOW() - INTERVAL '1 day' * $1::int` + typeClauseSql(2, 't.ticket_type'),
    [days, ...tp],
  )

  return {
    total_open: openRes.data[0]?.c ?? 0,
    sla_at_risk: slaRes.data[0]?.c ?? 0,
    escalated_open: escRes.data[0]?.c ?? 0,
    resolved_today: todayRes.data[0]?.c ?? 0,
    avg_resolution_hours: Number(resolRes.data[0]?.h ?? 0),
    first_response_hours: Number(frtRes.data[0]?.h ?? 0),
    range_days: days,
  }
}
