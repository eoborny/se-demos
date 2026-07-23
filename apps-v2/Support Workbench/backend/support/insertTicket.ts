import { logHistory, SLA_HOURS_BY_PRIORITY } from './history'

type NewCustomer = {
  email: string
  name: string
  company?: string | null
  plan_tier?: string | null
  account_id?: string | null
}

type NewEmployee = {
  email: string
  name: string
  department?: string | null
  manager_email?: string | null
  location?: string | null
}

type Params = {
  ticket_type: 'external' | 'internal'
  category: string
  priority: 'Urgent' | 'High' | 'Medium' | 'Low'
  subject: string
  description?: string | null
  source_channel?: string | null
  assignee_email?: string | null
  customer_id?: number | null
  employee_id?: number | null
  new_customer?: NewCustomer | null
  new_employee?: NewEmployee | null
}

async function nextTicketNumber(): Promise<string> {
  const res = await retoolDb.query<{ ticket_number: string }>(
    `SELECT ticket_number FROM support_tickets
     WHERE ticket_number LIKE 'SUP-2026-%'
     ORDER BY ticket_number DESC LIMIT 1`,
  )
  let next = 1
  const last = res.data[0]?.ticket_number
  if (last) {
    const parsed = parseInt(last.slice(last.lastIndexOf('-') + 1), 10)
    if (!Number.isNaN(parsed)) next = parsed + 1
  }
  return `SUP-2026-${String(next).padStart(5, '0')}`
}

export default async function insertTicket(req: { params: Params; user: User }) {
  const p = req.params
  const changedBy = req.user?.email ?? 'system'

  let customerId = p.customer_id ?? null
  let employeeId = p.employee_id ?? null

  if (p.ticket_type === 'external' && !customerId && p.new_customer) {
    const c = await retoolDb.query<{ id: number }>(
      `INSERT INTO support_customers (email, name, company, plan_tier, account_id, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [
        p.new_customer.email,
        p.new_customer.name,
        p.new_customer.company ?? null,
        p.new_customer.plan_tier ?? null,
        p.new_customer.account_id ?? null,
      ],
    )
    customerId = c.data[0]?.id ?? null
  }

  if (p.ticket_type === 'internal' && !employeeId && p.new_employee) {
    const e = await retoolDb.query<{ id: number }>(
      `INSERT INTO support_employees (email, name, department, manager_email, location, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [
        p.new_employee.email,
        p.new_employee.name,
        p.new_employee.department ?? null,
        p.new_employee.manager_email ?? null,
        p.new_employee.location ?? null,
      ],
    )
    employeeId = e.data[0]?.id ?? null
  }

  const ticketNumber = await nextTicketNumber()
  const slaHours = SLA_HOURS_BY_PRIORITY[p.priority] ?? 8

  const inserted = await retoolDb.query(
    `INSERT INTO support_tickets
       (ticket_number, ticket_type, status, priority, category, subject, description,
        assignee_email, customer_id, employee_id, source_channel, sla_due_at,
        created_at, updated_at)
     VALUES
       ($1, $2, 'New', $3, $4, $5, $6, $7, $8, $9, $10,
        NOW() + ($11 * INTERVAL '1 hour'), NOW(), NOW())
     RETURNING *`,
    [
      ticketNumber,
      p.ticket_type,
      p.priority,
      p.category,
      p.subject,
      p.description ?? null,
      p.assignee_email ?? null,
      customerId,
      employeeId,
      p.source_channel ?? null,
      slaHours,
    ],
  )

  const ticket = inserted.data[0] as { id: number } | undefined
  if (ticket) {
    await logHistory(ticket.id, changedBy, [
      { field: 'status', oldValue: null, newValue: 'New' },
    ])
  }

  return ticket ?? null
}
