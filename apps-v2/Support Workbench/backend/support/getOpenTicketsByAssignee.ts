import { typeClauseSql, typeParams } from './analytics'

type Params = { ticketType?: string }

export default async function getOpenTicketsByAssignee(req: { params: Params; user: User }) {
  const tp = typeParams(req.params?.ticketType)

  const result = await retoolDb.query<{ assignee: string; count: number }>(
    `SELECT COALESCE(assignee_email, 'Unassigned') AS assignee, COUNT(*)::int AS count
     FROM support_tickets
     WHERE status NOT IN ('Resolved', 'Closed')` + typeClauseSql(1) + `
     GROUP BY COALESCE(assignee_email, 'Unassigned')
     ORDER BY count DESC`,
    tp,
  )

  return result.data
}
