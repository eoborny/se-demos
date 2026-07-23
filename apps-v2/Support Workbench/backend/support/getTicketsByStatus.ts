import { typeClauseSql, typeParams } from './analytics'

type Params = { ticketType?: string }

export default async function getTicketsByStatus(req: { params: Params; user: User }) {
  const tp = typeParams(req.params?.ticketType)

  const result = await retoolDb.query<{ status: string; count: number }>(
    `SELECT status, COUNT(*)::int AS count
     FROM support_tickets
     WHERE 1 = 1` + typeClauseSql(1) + `
     GROUP BY status`,
    tp,
  )

  return result.data
}
