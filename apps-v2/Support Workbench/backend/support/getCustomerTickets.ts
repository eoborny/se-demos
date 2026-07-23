type Params = { customerId: number }

export default async function getCustomerTickets(req: { params: Params; user: User }) {
  const result = await retoolDb.query(
    `SELECT id, ticket_number, ticket_type, status, priority, category,
            subject, assignee_email, sla_due_at, created_at, resolved_at
     FROM support_tickets
     WHERE customer_id = $1
     ORDER BY created_at DESC`,
    [req.params.customerId],
  )
  return result.data
}
