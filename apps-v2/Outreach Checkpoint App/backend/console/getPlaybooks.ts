import { Playbook } from './shared'

type PlaybookSummary = Playbook & {
  version_count: number
  active_version_number: number | null
  total_drafts: number
  override_rate: number | null
}

// List all playbooks with high-level version + override stats.
export default async function getPlaybooks(_req: { params: Record<string, never> }) {
  const pbs = await retoolDb.query<Playbook>(`SELECT * FROM sdr_playbooks ORDER BY name ASC`)

  const stats = await retoolDb.query<{
    playbook_id: number
    version_count: number
    active_version_number: number | null
    total_drafts: number
    overridden: number
  }>(
    `SELECT pb.id AS playbook_id,
       COUNT(DISTINCT pv.id)::int AS version_count,
       MAX(pv.version_number) FILTER (WHERE pv.status = 'active') AS active_version_number,
       COUNT(DISTINCT d.id)::int AS total_drafts,
       COUNT(DISTINCT o.draft_id)::int AS overridden
     FROM sdr_playbooks pb
     LEFT JOIN sdr_playbook_versions pv ON pv.playbook_id = pb.id
     LEFT JOIN sdr_drafts d ON d.playbook_version_id = pv.id
     LEFT JOIN sdr_overrides o ON o.draft_id = d.id
     GROUP BY pb.id`
  )
  const map = new Map(stats.data.map((s) => [s.playbook_id, s]))

  const result: PlaybookSummary[] = pbs.data.map((pb) => {
    const s = map.get(pb.id)
    const total = s?.total_drafts ?? 0
    return {
      ...pb,
      version_count: s?.version_count ?? 0,
      active_version_number: s?.active_version_number ?? null,
      total_drafts: total,
      override_rate: total > 0 ? (s?.overridden ?? 0) / total : null,
    }
  })
  return result
}
