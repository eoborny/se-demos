import { logHistory, type HistoryChange } from './history'

type Changeset = {
  status?: string
  assignee_email?: string | null
  priority?: string
}

type Params = { id: number; changes: Changeset }

const CLOSED_STATUSES = ['Resolved', 'Closed']

export default async function updateTicket(req: { params: Params; user: User }) {
  const { id, changes } = req.params
  const changedBy = req.user?.email ?? 'system'

  const existingRes = await retoolDb.query<Record<string, unknown>>(
    `SELECT status, assignee_email, priority, resolved_at FROM support_tickets WHERE id = $1`,
    [id],
  )
  const existing = existingRes.data[0]
  if (!existing) return null

  const setClauses: string[] = []
  const values: unknown[] = []
  const history: HistoryChange[] = []
  let i = 1

  const fields: Array<keyof Changeset> = ['status', 'assignee_email', 'priority']
  for (const f of fields) {
    if (changes[f] === undefined) continue
    const oldVal = existing[f] as string | null
    const newVal = changes[f] as string | null
    if (String(oldVal ?? '') === String(newVal ?? '')) continue
    setClauses.push(`${f} = $${i}`)
    values.push(newVal)
    i += 1
    history.push({ field: f, oldValue: oldVal ?? null, newValue: newVal ?? null })
  }

  // Manage resolved_at when status transitions in/out of a closed state.
  if (changes.status !== undefined) {
    const nowClosed = CLOSED_STATUSES.includes(changes.status)
    const wasResolved = existing['resolved_at'] != null
    if (nowClosed && !wasResolved) {
      setClauses.push(`resolved_at = NOW()`)
    } else if (!nowClosed && wasResolved) {
      setClauses.push(`resolved_at = NULL`)
    }
  }

  if (setClauses.length === 0) {
    return existingRes.data[0] ?? null
  }

  setClauses.push(`updated_at = NOW()`)

  const updated = await retoolDb.query(
    `UPDATE support_tickets SET ${setClauses.join(', ')} WHERE id = $${i} RETURNING *`,
    [...values, id],
  )

  if (history.length) await logHistory(id, changedBy, history)

  return updated.data[0] ?? null
}
