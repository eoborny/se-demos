import { rangeDays, typeClauseSql, typeParams } from './analytics'

type Params = { dateRange?: string; ticketType?: string; openOnly?: boolean }

export default async function getTicketsByCategory(req: { params: Params; user: User }) {
  const p = req.params ?? {}
  const openOnly = p.openOnly !== false
  const useRange = !!p.dateRange
  const tp = typeParams(p.ticketType)

  // Build placeholders contiguously ($1, $2, ...) with no gaps.
  const params: unknown[] = [openOnly]
  let idx = 2
  let rangeSql = ''
  if (useRange) {
    rangeSql = ` AND created_at >= NOW() - INTERVAL '1 day' * $${idx}::int`
    params.push(rangeDays(p.dateRange))
    idx += 1
  }
  const typeSql = typeClauseSql(idx)
  params.push(...tp)

  const result = await retoolDb.query<{ category: string; count: number }>(
    `SELECT category, COUNT(*)::int AS count
     FROM support_tickets
     WHERE ($1::boolean = false OR status NOT IN ('Resolved', 'Closed'))` +
      rangeSql +
      typeSql +
      `
     GROUP BY category
     ORDER BY count DESC`,
    params,
  )

  return result.data
}
