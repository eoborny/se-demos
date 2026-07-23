type Params = {
  ticketType?: string // 'All' | 'external' | 'internal'
  status?: string
  priority?: string
  assignee?: string
  category?: string
}

export default async function getTickets(req: { params: Params; user: User }) {
  const p = req.params ?? {}
  const conditions: string[] = []
  const values: unknown[] = []
  let i = 1

  const add = (clause: (n: number) => string, value: unknown) => {
    conditions.push(clause(i))
    values.push(value)
    i += 1
  }

  if (p.ticketType && p.ticketType !== 'All') add((n) => `t.ticket_type = $${n}`, p.ticketType)
  if (p.status && p.status !== 'All') add((n) => `t.status = $${n}`, p.status)
  if (p.priority && p.priority !== 'All') add((n) => `t.priority = $${n}`, p.priority)
  if (p.assignee && p.assignee !== 'All') add((n) => `t.assignee_email = $${n}`, p.assignee)
  if (p.category && p.category !== 'All') add((n) => `t.category = $${n}`, p.category)

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const result = await retoolDb.query(
    `SELECT
        t.id, t.ticket_number, t.ticket_type, t.status, t.priority, t.category,
        t.subject, t.description, t.assignee_email, t.customer_id, t.employee_id,
        t.source_channel, t.sla_due_at, t.linear_issue_id,
        t.created_at, t.updated_at, t.resolved_at,
        c.name AS customer_name, c.company AS customer_company,
        e.name AS employee_name, e.department AS employee_department
     FROM support_tickets t
     LEFT JOIN support_customers c ON t.customer_id = c.id
     LEFT JOIN support_employees e ON t.employee_id = e.id
     ${where}
     ORDER BY t.created_at DESC`,
    values,
  )

  return result.data
}
