import { logHistory, type HistoryChange } from './history'

type Params = {
  ticketId: number
  changes: HistoryChange[]
}

export default async function insertHistory(req: { params: Params; user: User }) {
  const { ticketId, changes } = req.params
  const changedBy = req.user?.email ?? 'system'
  await logHistory(ticketId, changedBy, changes ?? [])
  return { ok: true, count: changes?.length ?? 0 }
}
