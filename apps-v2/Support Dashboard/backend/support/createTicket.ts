// Create a new support ticket. Auto-generates the next ticket_number.

type Params = {
  subject: string
  description?: string | null
  ticket_type: string
  priority: string
  status: string
  category: string
  assignee_email?: string | null
  source_channel?: string | null
  sla_due_at?: string | null
}

export default async function createTicket(req: { params: Params }): Promise<{ id: number; ticket_number: string }> {
  const p = req.params

  if (!p.subject || !p.subject.trim()) {
    throw new Error('Subject is required')
  }

  // Generate the next ticket number based on the current max.
  const maxRes = await retoolDb.query<{ mx: string | null }>(
    `SELECT MAX(ticket_number) AS mx FROM support_tickets`,
  )
  const year = new Date().getFullYear()
  let nextSeq = 1
  const mx = maxRes.data[0]?.mx
  if (mx) {
    const parts = mx.split('-')
    const seq = parseInt(parts[parts.length - 1] ?? '0', 10)
    if (!Number.isNaN(seq)) nextSeq = seq + 1
  }
  const ticketNumber = `SUP-${year}-${String(nextSeq).padStart(5, '0')}`

  const result = await retoolDb.query<{ id: number; ticket_number: string }>(
    `INSERT INTO support_tickets
      (ticket_number, ticket_type, status, priority, category, subject, description, assignee_email, source_channel, sla_due_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now())
     RETURNING id, ticket_number`,
    [
      ticketNumber,
      p.ticket_type,
      p.status,
      p.priority,
      p.category,
      p.subject.trim(),
      p.description ?? null,
      p.assignee_email || null,
      p.source_channel || null,
      p.sla_due_at || null,
    ],
  )
  return result.data[0]!
}
