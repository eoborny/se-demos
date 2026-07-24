// List support tickets with optional filtering by status, priority, category, and search.

export type Ticket = {
  id: number
  ticket_number: string
  ticket_type: string
  status: string
  priority: string
  category: string
  subject: string
  description: string | null
  assignee_email: string | null
  customer_id: number | null
  employee_id: number | null
  source_channel: string | null
  sla_due_at: string | null
  linear_issue_id: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
}

type Params = {
  status?: string
  priority?: string
  category?: string
  assignee?: string
  search?: string
}

export default async function getTickets(req: { params?: Params }): Promise<Ticket[]> {
  const p = req.params ?? {}
  const clauses: string[] = []
  const values: unknown[] = []

  if (p.status && p.status !== 'all') {
    values.push(p.status)
    clauses.push(`status = $${values.length}`)
  }
  if (p.priority && p.priority !== 'all') {
    values.push(p.priority)
    clauses.push(`priority = $${values.length}`)
  }
  if (p.category && p.category !== 'all') {
    values.push(p.category)
    clauses.push(`category = $${values.length}`)
  }
  if (p.assignee && p.assignee !== 'all') {
    values.push(p.assignee)
    clauses.push(`assignee_email = $${values.length}`)
  }
  if (p.search && p.search.trim()) {
    values.push(`%${p.search.trim()}%`)
    clauses.push(`(subject ILIKE $${values.length} OR ticket_number ILIKE $${values.length} OR description ILIKE $${values.length})`)
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const result = await retoolDb.query<Ticket>(
    `SELECT * FROM support_tickets ${where} ORDER BY created_at DESC`,
    values,
  )
  return result.data
}
