import { coerceRole, audit } from './shared'

type Params = { draftId: number; eventType: string; source?: string; actor: string; role: string }

const VALID = ['sent', 'replied', 'bounced', 'opted_out']

// Webhook-style receiver / manual fallback for downstream outcome events from the
// sequencing/CRM tool. Records a single event for a draft.
export default async function logDraftOutcome(req: { params: Params }) {
  const role = coerceRole(req.params.role)
  const p = req.params
  if (!VALID.includes(p.eventType)) throw new Error(`Invalid event_type. Expected one of: ${VALID.join(', ')}`)

  const draft = await retoolDb.query<{ id: number; account_name: string }>(
    `SELECT id, account_name FROM sdr_drafts WHERE id = $1`, [p.draftId]
  )
  if (!draft.data[0]) throw new Error('Draft not found')

  await retoolDb.query(
    `INSERT INTO sdr_draft_outcomes (draft_id, event_type, source) VALUES ($1, $2, $3)`,
    [p.draftId, p.eventType, p.source?.trim() || 'Manual entry']
  )

  await audit({
    draftId: p.draftId, accountName: draft.data[0].account_name, actor: p.actor, actorRole: role,
    action: 'outcome', after: p.eventType, detail: `Outcome logged: ${p.eventType} (${p.source?.trim() || 'Manual entry'})`,
  })

  return { ok: true, eventType: p.eventType }
}
