import { coerceRole, audit, evaluateSensitivity, ExperimentVariant } from './shared'

type Params = {
  playbookId: number
  accountName?: string
  contactName?: string
  accountTier?: string
  repName?: string
  actor: string
  role: string
}

// Weighted random selection by traffic_split.
function weightedPick(variants: ExperimentVariant[]): ExperimentVariant {
  const total = variants.reduce((s, v) => s + v.traffic_split, 0)
  let r = Math.random() * (total || 1)
  for (const v of variants) {
    r -= v.traffic_split
    if (r <= 0) return v
  }
  return variants[variants.length - 1]!
}

// Simulates the AI drafting pipeline producing a new draft.
// - No running experiment: tag with the active playbook version.
// - Running experiment: silently assign a variant by weighted split, sticky per account.
export default async function createDraftFromPlaybook(req: { params: Params }) {
  const role = coerceRole(req.params.role)
  const p = req.params

  const pb = await retoolDb.query<{ name: string; outreach_type: string }>(
    `SELECT name, outreach_type FROM sdr_playbooks WHERE id = $1`, [p.playbookId]
  )
  const playbook = pb.data[0]
  if (!playbook) throw new Error('Playbook not found')

  const account = p.accountName?.trim() || 'New Prospect Account'
  const tier = p.accountTier || 'Mid-Market'
  const contact = p.contactName?.trim() || 'New Contact'
  const rep = p.repName || p.actor
  const type = playbook.outreach_type

  // Is there a running experiment on this playbook?
  const running = await retoolDb.query<{ id: number }>(
    `SELECT id FROM sdr_experiments WHERE playbook_id = $1 AND status = 'running'`, [p.playbookId]
  )
  const experiment = running.data[0]

  let versionId: number
  let experimentId: number | null = null
  let variantId: number | null = null
  let versionNumber: number

  if (experiment) {
    const variantsRes = await retoolDb.query<ExperimentVariant>(
      `SELECT * FROM sdr_experiment_variants WHERE experiment_id = $1`, [experiment.id]
    )
    const variants = variantsRes.data
    if (variants.length === 0) throw new Error('Experiment has no variants')

    // Sticky per account: reuse the variant this account already received in this experiment.
    const prior = await retoolDb.query<{ experiment_variant_id: number }>(
      `SELECT experiment_variant_id FROM sdr_drafts
       WHERE experiment_id = $1 AND account_name = $2 AND experiment_variant_id IS NOT NULL
       ORDER BY created_at ASC LIMIT 1`,
      [experiment.id, account]
    )
    const stickyVariantId = prior.data[0]?.experiment_variant_id
    const chosen = stickyVariantId
      ? variants.find((v) => v.id === stickyVariantId) ?? weightedPick(variants)
      : weightedPick(variants)

    experimentId = experiment.id
    variantId = chosen.id
    versionId = chosen.playbook_version_id
    const vn = await retoolDb.query<{ version_number: number }>(
      `SELECT version_number FROM sdr_playbook_versions WHERE id = $1`, [versionId]
    )
    versionNumber = vn.data[0]?.version_number ?? 0
  } else {
    const active = await retoolDb.query<{ id: number; version_number: number }>(
      `SELECT id, version_number FROM sdr_playbook_versions WHERE playbook_id = $1 AND status = 'active'`, [p.playbookId]
    )
    const activeVersion = active.data[0]
    if (!activeVersion) throw new Error('This playbook has no active version to draft from')
    versionId = activeVersion.id
    versionNumber = activeVersion.version_number
  }

  const content = `Hi ${contact.split(' ')[0]},\n\n[AI-drafted ${type} generated from "${playbook.name}". This is a fresh draft awaiting your review.]\n\nBest,\n${rep.split(' ')[0]}`
  const check = await evaluateSensitivity({ content, accountTier: tier })
  const status = check.sensitive ? 'Pending Sensitive-Content Approval' : 'Pending Review'
  const research = {
    firmographics: [`${tier} account`],
    recent_news: ['Auto-generated draft — research pipeline pending.'],
    intent_signals: [],
    thread_history: ['No prior contact'],
  }

  const res = await retoolDb.query<{ id: number }>(
    `INSERT INTO sdr_drafts
      (account_name, account_tier, contact_name, contact_title, rep_name, outreach_type, sequence_step, priority, status, subject, ai_original, current_content, confidence, research, sensitive, sensitive_reason, approver, playbook_version_id, experiment_id, experiment_variant_id)
     VALUES ($1,$2,$3,$4,$5,$6,'Step 1 - Intro','Medium',$7,$8,$9,$9,0.82,$10,$11,$12,$13,$14,$15,$16)
     RETURNING id`,
    [account, tier, contact, 'Decision Maker', rep, type, status,
     type === 'Email' ? `Intro from ${rep.split(' ')[0]}` : null,
     content, JSON.stringify(research), check.sensitive, check.reason, check.approver, versionId, experimentId, variantId]
  )
  const id = res.data[0]?.id

  // Note: the audit detail records the version but never the experiment variant (kept out of rep-facing surfaces).
  await audit({
    draftId: id, accountName: account, actor: p.actor, actorRole: role,
    action: 'create', after: status,
    detail: `New draft from "${playbook.name}" v${versionNumber}`,
  })

  return { id, status, version_number: versionNumber }
}
