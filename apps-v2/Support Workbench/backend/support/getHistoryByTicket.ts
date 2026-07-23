type Params = { ticketId: number }

export default async function getHistoryByTicket(req: { params: Params; user: User }) {
  const result = await retoolDb.query(
    `SELECT id, ticket_id, field_changed, old_value, new_value, changed_by, changed_at
     FROM support_ticket_history
     WHERE ticket_id = $1
     ORDER BY changed_at DESC`,
    [req.params.ticketId],
  )
  return result.data
}
