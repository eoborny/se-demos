type Params = { ticketId: number }

const MODEL = 'gpt-4o-mini'

export default async function generateAISummary(req: { params: Params; user: User }) {
  const { ticketId } = req.params

  const ticketRes = await retoolDb.query<{
    subject: string
    description: string | null
    category: string
    priority: string
    status: string
  }>(
    `SELECT subject, description, category, priority, status
     FROM support_tickets WHERE id = $1`,
    [ticketId],
  )
  const ticket = ticketRes.data[0]
  if (!ticket) return null

  const notesRes = await retoolDb.query<{
    author_email: string
    body: string
    is_internal: boolean
  }>(
    `SELECT author_email, body, is_internal
     FROM support_ticket_notes WHERE ticket_id = $1 ORDER BY created_at ASC`,
    [ticketId],
  )

  const notesText = notesRes.data.length
    ? notesRes.data
        .map(
          (n) =>
            `- (${n.is_internal ? 'internal' : 'external'}) ${n.author_email}: ${n.body}`,
        )
        .join('\n')
    : 'No notes yet.'

  const instruction = `Summarize the following customer support ticket in 2-3 concise sentences for a support agent. Focus on the core problem, current status, and any action taken.

Subject: ${ticket.subject}
Category: ${ticket.category} | Priority: ${ticket.priority} | Status: ${ticket.status}
Description: ${ticket.description ?? '(none)'}

Notes:
${notesText}`

  const ai = await openai.text.generate({
    instruction,
    model: MODEL,
    systemMessage:
      'You are a support operations assistant. Write clear, neutral, factual summaries. No preamble.',
    temperature: 0.3,
  })

  const summaryText = ai.data.queryData.data.trim()

  const inserted = await retoolDb.query(
    `INSERT INTO support_ai_summaries (ticket_id, summary_text, model, generated_at)
     VALUES ($1, $2, $3, NOW())
     RETURNING id, ticket_id, summary_text, model, generated_at`,
    [ticketId, summaryText, MODEL],
  )

  return inserted.data[0] ?? null
}
