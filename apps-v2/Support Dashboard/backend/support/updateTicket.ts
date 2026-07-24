// Update an existing support ticket. Sets resolved_at when moving to a resolved/closed status.

type Params = {
  id: number
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

const RESOLVED_STATUSES = ['Resolved', 'Closed']

export default async function updateTicket(req: { params: Params }): Promise<{ id: number }> {
  const p = req.params
  if (!p.id) throw new Error('Ticket id is required')
  if (!p.subject || !p.subject.trim()) throw new Error('Subject is required')

  const resolvedExpr = RESOLVED_STATUSES.includes(p.status)
    ? 'COALESCE(resolved_at, now())'
    : 'NULL'

  const result = await retoolDb.query<{ id: number }>(
    `UPDATE support_tickets SET
       subject = $1,
       description = $2,
       ticket_type = $3,
       priority = $4,
       status = $5,
       category = $6,
       assignee_email = $7,
       source_channel = $8,
       sla_due_at = $9,
       resolved_at = ${resolvedExpr},
       updated_at = now()
     WHERE id = $10
     RETURNING id`,
    [
      p.subject.trim(),
      p.description ?? null,
      p.ticket_type,
      p.priority,
      p.status,
      p.category,
      p.assignee_email || null,
      p.source_channel || null,
      p.sla_due_at || null,
      p.id,
    ],
  )
  if (result.data.length === 0) throw new Error(`Ticket ${p.id} not found`)
  return result.data[0]!
}
