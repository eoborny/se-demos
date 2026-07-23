type Params = { id: number }

export default async function getTicketById(req: { params: Params; user: User }) {
  const result = await retoolDb.query(
    `SELECT
        t.id, t.ticket_number, t.ticket_type, t.status, t.priority, t.category,
        t.subject, t.description, t.assignee_email, t.customer_id, t.employee_id,
        t.source_channel, t.sla_due_at, t.linear_issue_id,
        t.created_at, t.updated_at, t.resolved_at,
        c.id AS customer_pk, c.name AS customer_name, c.email AS customer_email,
        c.company AS customer_company, c.plan_tier AS customer_plan_tier,
        c.account_id AS customer_account_id, c.stripe_customer_id AS customer_stripe_id,
        c.notes AS customer_notes,
        e.id AS employee_pk, e.name AS employee_name, e.email AS employee_email,
        e.department AS employee_department, e.manager_email AS employee_manager,
        e.location AS employee_location
     FROM support_tickets t
     LEFT JOIN support_customers c ON t.customer_id = c.id
     LEFT JOIN support_employees e ON t.employee_id = e.id
     WHERE t.id = $1`,
    [req.params.id],
  )
  return result.data[0] ?? null
}
