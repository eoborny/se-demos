export default async function getOpenTicketsByType(_req: { params: unknown; user: User }) {
  const result = await retoolDb.query<{ type: string; count: number }>(
    `SELECT ticket_type AS type, COUNT(*)::int AS count
     FROM support_tickets
     WHERE status NOT IN ('Resolved', 'Closed')
     GROUP BY ticket_type
     ORDER BY ticket_type`,
  )
  return result.data
}
