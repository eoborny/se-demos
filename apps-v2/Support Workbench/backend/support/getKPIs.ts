export default async function getKPIs(_req: { params: unknown; user: User }) {
  const result = await retoolDb.query(
    `SELECT
        (SELECT COUNT(*)::int FROM support_tickets
           WHERE status NOT IN ('Resolved', 'Closed')) AS open_tickets,
        (SELECT COUNT(*)::int FROM support_tickets
           WHERE priority = 'Urgent' AND status NOT IN ('Resolved', 'Closed')) AS urgent_count,
        (SELECT COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600.0)::numeric, 1), 0)
           FROM support_tickets WHERE resolved_at IS NOT NULL) AS avg_resolution_hours,
        (SELECT COUNT(*)::int FROM support_tickets
           WHERE sla_due_at < NOW() AND status NOT IN ('Resolved', 'Closed')) AS sla_at_risk`,
  )
  return result.data[0] ?? null
}
