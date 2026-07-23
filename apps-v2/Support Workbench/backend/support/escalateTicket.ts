import { logHistory, type HistoryChange } from './history'

type Params = { id: number; linearIssueId?: string | null }

export default async function escalateTicket(req: { params: Params; user: User }) {
  const { id, linearIssueId } = req.params
  const changedBy = req.user?.email ?? 'system'

  const existingRes = await retoolDb.query<{ status: string; linear_issue_id: string | null }>(
    `SELECT status, linear_issue_id FROM support_tickets WHERE id = $1`,
    [id],
  )
  const existing = existingRes.data[0]
  if (!existing) return null

  const updated = await retoolDb.query(
    `UPDATE support_tickets
     SET status = 'Escalated', linear_issue_id = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [linearIssueId ?? null, id],
  )

  const history: HistoryChange[] = []
  if (existing.status !== 'Escalated') {
    history.push({ field: 'status', oldValue: existing.status, newValue: 'Escalated' })
  }
  if ((existing.linear_issue_id ?? '') !== (linearIssueId ?? '')) {
    history.push({
      field: 'linear_issue_id',
      oldValue: existing.linear_issue_id ?? null,
      newValue: linearIssueId ?? null,
    })
  }
  if (history.length) await logHistory(id, changedBy, history)

  return updated.data[0] ?? null
}
