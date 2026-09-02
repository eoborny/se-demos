import { coerceRole, audit } from './shared'

type VariantInput = { playbookVersionId: number; label: string; trafficSplit: number }
type Params = {
  playbookId: number
  name: string
  hypothesis?: string
  variants: VariantInput[]
  actor: string
  role: string
}

// Creates an experiment in 'draft' status with its variants. Traffic splits must sum to 100.
export default async function createExperiment(req: { params: Params }) {
  const role = coerceRole(req.params.role)
  if (role !== 'admin' && role !== 'manager') throw new Error('Only managers or admins can create experiments')
  const p = req.params

  if (!p.name || !p.name.trim()) throw new Error('Experiment name is required')
  if (!p.variants || p.variants.length < 2) throw new Error('An experiment needs at least two variants')
  const sum = p.variants.reduce((s, v) => s + Number(v.trafficSplit || 0), 0)
  if (sum !== 100) throw new Error(`Traffic splits must sum to 100 (got ${sum})`)

  const exp = await retoolDb.query<{ id: number }>(
    `INSERT INTO sdr_experiments (playbook_id, name, hypothesis, status, created_by)
     VALUES ($1, $2, $3, 'draft', $4) RETURNING id`,
    [p.playbookId, p.name.trim(), p.hypothesis?.trim() || null, p.actor]
  )
  const expId = exp.data[0]!.id

  for (const v of p.variants) {
    await retoolDb.query(
      `INSERT INTO sdr_experiment_variants (experiment_id, playbook_version_id, label, traffic_split)
       VALUES ($1, $2, $3, $4)`,
      [expId, v.playbookVersionId, v.label, v.trafficSplit]
    )
  }

  await audit({ actor: p.actor, actorRole: role, action: 'config', detail: `Created experiment "${p.name.trim()}"` })
  return { id: expId }
}
