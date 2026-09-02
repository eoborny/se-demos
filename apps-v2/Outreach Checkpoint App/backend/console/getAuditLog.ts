type Params = { search?: string; action?: string; actor?: string; dateFrom?: string; dateTo?: string }

export type AuditRow = {
  id: number
  draft_id: number | null
  account_name: string | null
  actor: string
  actor_role: string | null
  action: string
  before_state: string | null
  after_state: string | null
  detail: string | null
  created_at: string
}

// Returns the audit log, filterable by user, account, action type, and date range.
export default async function getAuditLog(req: { params: Params }) {
  const p = req.params
  const where: string[] = []
  const args: unknown[] = []

  if (p.search && p.search.trim()) {
    args.push(`%${p.search.trim()}%`)
    const i = args.length
    where.push(`(account_name ILIKE $${i} OR actor ILIKE $${i} OR detail ILIKE $${i})`)
  }
  if (p.action && p.action !== 'all') {
    args.push(p.action)
    where.push(`action = $${args.length}`)
  }
  if (p.actor && p.actor !== 'all') {
    args.push(p.actor)
    where.push(`actor = $${args.length}`)
  }
  if (p.dateFrom) {
    args.push(p.dateFrom)
    where.push(`created_at >= $${args.length}`)
  }
  if (p.dateTo) {
    args.push(p.dateTo)
    where.push(`created_at <= $${args.length}`)
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const result = await retoolDb.query<AuditRow>(
    `SELECT * FROM sdr_audit_log ${whereSql} ORDER BY created_at DESC LIMIT 500`,
    args
  )
  return result.data
}
