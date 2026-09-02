import { Experiment } from './shared'

type Params = { playbookId: number }

// Lists experiments for a playbook, with variant labels and draft counts.
export default async function getExperiments(req: { params: Params }) {
  const exps = await retoolDb.query<Experiment>(
    `SELECT * FROM sdr_experiments WHERE playbook_id = $1 ORDER BY created_at DESC`,
    [req.params.playbookId]
  )

  const variantRows = await retoolDb.query<{
    experiment_id: number
    id: number
    label: string
    playbook_version_id: number
    version_number: number
    traffic_split: number
    draft_count: number
  }>(
    `SELECT ev.experiment_id, ev.id, ev.label, ev.playbook_version_id, pv.version_number, ev.traffic_split,
       COUNT(d.id)::int AS draft_count
     FROM sdr_experiment_variants ev
     JOIN sdr_playbook_versions pv ON ev.playbook_version_id = pv.id
     LEFT JOIN sdr_drafts d ON d.experiment_variant_id = ev.id
     WHERE ev.experiment_id IN (SELECT id FROM sdr_experiments WHERE playbook_id = $1)
     GROUP BY ev.experiment_id, ev.id, ev.label, ev.playbook_version_id, pv.version_number, ev.traffic_split
     ORDER BY ev.label ASC`,
    [req.params.playbookId]
  )

  const byExp = new Map<number, typeof variantRows.data>()
  for (const v of variantRows.data) {
    const arr = byExp.get(v.experiment_id) ?? []
    arr.push(v)
    byExp.set(v.experiment_id, arr)
  }

  return exps.data.map((e) => ({ ...e, variants: byExp.get(e.id) ?? [] }))
}
