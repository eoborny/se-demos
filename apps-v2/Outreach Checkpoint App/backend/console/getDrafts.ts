import { coerceRole, DraftRow, APPROVER_NAME } from './shared'

type Params = {
  role: string
  repName: string
  status?: string
  outreachType?: string
  priority?: string
  search?: string
  sort?: string
  scope?: 'active' | 'all'
}

// Returns the drafts a given role is allowed to see, with optional filters/sort.
export default async function getDrafts(req: { params: Params }) {
  const role = coerceRole(req.params.role)
  const p = req.params

  const where: string[] = []
  const args: unknown[] = []

  // Role-based data scoping
  if (role === 'rep') {
    args.push(p.repName)
    where.push(`d.rep_name = $${args.length}`)
  } else if (role === 'approver') {
    where.push(`(d.approver IS NOT NULL AND (d.status = 'Pending Sensitive-Content Approval' OR d.approver = '${APPROVER_NAME.replace(/'/g, "''")}'))`)
  }
  // manager / admin / revops see everything

  if (p.status && p.status !== 'all') {
    args.push(p.status)
    where.push(`d.status = $${args.length}`)
  }
  if (p.outreachType && p.outreachType !== 'all') {
    args.push(p.outreachType)
    where.push(`d.outreach_type = $${args.length}`)
  }
  if (p.priority && p.priority !== 'all') {
    args.push(p.priority)
    where.push(`d.priority = $${args.length}`)
  }
  if (p.search && p.search.trim()) {
    args.push(`%${p.search.trim()}%`)
    const i = args.length
    where.push(`(d.account_name ILIKE $${i} OR d.contact_name ILIKE $${i} OR d.subject ILIKE $${i})`)
  }

  let orderBy = 'd.created_at DESC'
  if (p.sort === 'oldest') orderBy = 'd.created_at ASC'
  else if (p.sort === 'priority') orderBy = `CASE d.priority WHEN 'High' THEN 0 WHEN 'Medium' THEN 1 ELSE 2 END, d.created_at DESC`
  else if (p.sort === 'account') orderBy = 'd.account_name ASC'
  else if (p.sort === 'confidence') orderBy = 'd.confidence DESC'

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const result = await retoolDb.query<DraftRow>(
    `SELECT d.*, pv.version_number AS playbook_version_number, pb.name AS playbook_name
     FROM sdr_drafts d
     LEFT JOIN sdr_playbook_versions pv ON d.playbook_version_id = pv.id
     LEFT JOIN sdr_playbooks pb ON pv.playbook_id = pb.id
     ${whereSql} ORDER BY ${orderBy}`,
    args
  )
  return result.data
}
