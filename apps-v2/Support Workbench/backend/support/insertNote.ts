type Params = {
  ticketId: number
  body: string
  isInternal: boolean
}

export default async function insertNote(req: { params: Params; user: User }) {
  const { ticketId, body, isInternal } = req.params
  const author = req.user?.email ?? 'system'

  const inserted = await retoolDb.query(
    `INSERT INTO support_ticket_notes (ticket_id, author_email, body, is_internal, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING id, ticket_id, author_email, body, is_internal, created_at`,
    [ticketId, author, body, isInternal],
  )

  await retoolDb.query(`UPDATE support_tickets SET updated_at = NOW() WHERE id = $1`, [ticketId])

  return inserted.data[0] ?? null
}
