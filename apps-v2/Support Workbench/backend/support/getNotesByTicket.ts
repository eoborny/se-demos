type Params = { ticketId: number }

export default async function getNotesByTicket(req: { params: Params; user: User }) {
  const result = await retoolDb.query(
    `SELECT id, ticket_id, author_email, body, is_internal, created_at
     FROM support_ticket_notes
     WHERE ticket_id = $1
     ORDER BY created_at ASC`,
    [req.params.ticketId],
  )
  return result.data
}
