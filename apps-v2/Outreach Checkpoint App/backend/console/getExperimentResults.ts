import { Experiment, MIN_SENT_PER_VARIANT } from './shared'

type Params = { experimentId: number }

type VariantRow = {
  id: number
  label: string
  traffic_split: number
  playbook_version_id: number
  version_number: number
  drafts: number
  approved_no_edit: number
  overridden: number
  sent: number
  replied: number
}

// Standard normal CDF via an erf approximation (Abramowitz & Stegun 7.1.26).
function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const d = 0.3989423 * Math.exp((-z * z) / 2)
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  p = 1 - p
  return z >= 0 ? p : 1 - p
}

export default async function getExperimentResults(req: { params: Params }) {
  const expRes = await retoolDb.query<Experiment & { playbook_name: string }>(
    `SELECT e.*, pb.name AS playbook_name FROM sdr_experiments e
     JOIN sdr_playbooks pb ON e.playbook_id = pb.id WHERE e.id = $1`,
    [req.params.experimentId]
  )
  const experiment = expRes.data[0]
  if (!experiment) throw new Error('Experiment not found')

  const rows = await retoolDb.query<VariantRow>(
    `SELECT ev.id, ev.label, ev.traffic_split, ev.playbook_version_id, pv.version_number,
       COUNT(DISTINCT d.id)::int AS drafts,
       COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'Approved')::int AS approved_no_edit,
       COUNT(DISTINCT o.draft_id)::int AS overridden,
       COUNT(DISTINCT st.draft_id)::int AS sent,
       COUNT(DISTINCT rp.draft_id)::int AS replied
     FROM sdr_experiment_variants ev
     JOIN sdr_playbook_versions pv ON ev.playbook_version_id = pv.id
     LEFT JOIN sdr_drafts d ON d.experiment_variant_id = ev.id
     LEFT JOIN sdr_overrides o ON o.draft_id = d.id
     LEFT JOIN sdr_draft_outcomes st ON st.draft_id = d.id AND st.event_type = 'sent'
     LEFT JOIN sdr_draft_outcomes rp ON rp.draft_id = d.id AND rp.event_type = 'replied'
     WHERE ev.experiment_id = $1
     GROUP BY ev.id, ev.label, ev.traffic_split, ev.playbook_version_id, pv.version_number
     ORDER BY ev.label ASC`,
    [req.params.experimentId]
  )

  const variants = rows.data.map((v) => ({
    ...v,
    approval_no_edit_rate: v.drafts > 0 ? v.approved_no_edit / v.drafts : null,
    override_rate: v.drafts > 0 ? v.overridden / v.drafts : null,
    // Missing/delayed outcome data → pending, not a zero reply rate.
    reply_rate: v.sent > 0 ? v.replied / v.sent : null,
    reply_pending: v.sent === 0,
  }))

  // Compare the highest vs lowest observed reply rate among variants with data.
  const withData = variants.filter((v) => v.reply_rate != null)
  let comparison: {
    leaderLabel: string
    baselineLabel: string
    leaderRate: number
    baselineRate: number
    relativeLift: number | null
    zScore: number | null
    confidence: number | null
    significant: boolean
    enoughData: boolean
    minSent: number
    summary: string
  } | null = null

  if (variants.length >= 2 && withData.length >= 2) {
    const sorted = [...withData].sort((a, b) => (b.reply_rate ?? 0) - (a.reply_rate ?? 0))
    const leader = sorted[0]!
    const baseline = sorted[sorted.length - 1]!
    const n1 = baseline.sent
    const n2 = leader.sent
    const p1 = baseline.reply_rate ?? 0
    const p2 = leader.reply_rate ?? 0
    const enoughData = n1 >= MIN_SENT_PER_VARIANT && n2 >= MIN_SENT_PER_VARIANT

    let z: number | null = null
    let confidence: number | null = null
    let significant = false
    const pooled = (baseline.replied + leader.replied) / (n1 + n2 || 1)
    const se = Math.sqrt(pooled * (1 - pooled) * (1 / (n1 || 1) + 1 / (n2 || 1)))
    if (se > 0) {
      z = (p2 - p1) / se
      const twoSidedP = 2 * (1 - normalCdf(Math.abs(z)))
      confidence = Math.max(0, Math.min(100, (1 - twoSidedP) * 100))
      significant = enoughData && Math.abs(z) >= 1.96
    }
    const relativeLift = p1 > 0 ? (p2 - p1) / p1 : null

    let summary: string
    const liftPct = relativeLift != null ? Math.round(relativeLift * 100) : null
    if (!enoughData) {
      const deficit = Math.max(MIN_SENT_PER_VARIANT - n1, MIN_SENT_PER_VARIANT - n2, 0)
      summary = liftPct != null
        ? `Variant ${leader.label} has a ${liftPct}% higher reply rate than Variant ${baseline.label} (not yet statistically significant — needs ~${deficit} more sends).`
        : `Not enough data yet — needs ~${deficit} more sends per variant.`
    } else if (significant) {
      summary = `Variant ${leader.label} has a ${liftPct}% higher reply rate than Variant ${baseline.label} — statistically significant (~${Math.round(confidence ?? 0)}% confidence).`
    } else {
      summary = `Variant ${leader.label} leads by ${liftPct}% but the difference is not yet statistically significant (~${Math.round(confidence ?? 0)}% confidence).`
    }

    comparison = {
      leaderLabel: leader.label,
      baselineLabel: baseline.label,
      leaderRate: p2,
      baselineRate: p1,
      relativeLift,
      zScore: z,
      confidence,
      significant,
      enoughData,
      minSent: MIN_SENT_PER_VARIANT,
      summary,
    }
  }

  return { experiment, threshold: MIN_SENT_PER_VARIANT, variants, comparison }
}
