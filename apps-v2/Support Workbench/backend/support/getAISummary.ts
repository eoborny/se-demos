type Params = { ticketId: number }

export default async function getAISummary(req: { params: Params; user: User }) {
  const result = await retoolDb.query(
    `SELECT id, ticket_id, summary_text, model, generated_at
     FROM support_ai_summaries
     WHERE ticket_id = $1
     ORDER BY generated_at DESC
     LIMIT 1`,
    [req.params.ticketId],
  )
  return result.data[0] ?? null
}
