import { coerceRole, DraftRow } from './shared'

type Params = { id: number; prompt: string; actor: string; role: string }

// Regenerates a draft's body with AI based on a free-text change request.
// Returns the proposed text WITHOUT persisting — the caller previews, then applies.
export default async function regenerateDraft(req: { params: Params }) {
  const p = req.params
  coerceRole(p.role)
  if (!p.prompt || !p.prompt.trim()) throw new Error('Describe what you want changed')

  const res = await retoolDb.query<DraftRow>(`SELECT * FROM sdr_drafts WHERE id = $1`, [p.id])
  const draft = res.data[0]
  if (!draft) throw new Error('Draft not found')

  const research = draft.research ?? {}
  const context = [
    `Outreach type: ${draft.outreach_type}`,
    `Account: ${draft.account_name} (${draft.account_tier})`,
    `Contact: ${draft.contact_name}${draft.contact_title ? `, ${draft.contact_title}` : ''}`,
    draft.subject ? `Subject: ${draft.subject}` : null,
    `Sales rep: ${draft.rep_name}`,
    Array.isArray(research.recent_news) && research.recent_news.length ? `Recent news: ${research.recent_news.join('; ')}` : null,
    Array.isArray(research.intent_signals) && research.intent_signals.length ? `Intent signals: ${research.intent_signals.join('; ')}` : null,
  ].filter(Boolean).join('\n')

  const instruction = `You are rewriting a sales outreach draft for Asana.

CONTEXT
${context}

CURRENT DRAFT
${draft.current_content}

REQUESTED CHANGES
${p.prompt.trim()}

Rewrite the draft applying the requested changes. Keep it appropriate for a ${draft.outreach_type}. Return ONLY the rewritten message body — no preamble, no explanation, no surrounding quotes.`

  const result = await anthropic.text.generate({
    instruction,
    model: 'claude-sonnet-4-6',
    systemMessage:
      'You are an expert SDR copywriter for Asana. You write concise, specific, on-brand B2B outreach with a warm, human tone. Never invent statistics or make guarantees. Output only the message text.',
    temperature: 0.7,
  })

  const text = result.data.queryData.data?.trim() ?? ''
  if (!text) throw new Error('The model returned an empty draft — try rephrasing your prompt')

  return { content: text }
}
