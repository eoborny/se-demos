import { MIN_SAMPLE_SIZE, Playbook, PlaybookVersion } from './shared'

type Params = { playbookId: number }

type VersionAnalytics = PlaybookVersion & {
  draft_count: number
  overridden_count: number
  override_rate: number | null
  reasons: { reason: string; count: number }[]
  delta: {
    prev_version_number: number | null
    value: number | null // fraction reduction vs previous version (positive = improvement)
    enough_data: boolean
  }
}

// Returns a playbook, all its versions, and per-version override analytics.
export default async function getPlaybookDetail(req: { params: Params }) {
  const pid = req.params.playbookId
  const pbRes = await retoolDb.query<Playbook>(`SELECT * FROM sdr_playbooks WHERE id = $1`, [pid])
  const playbook = pbRes.data[0]
  if (!playbook) throw new Error('Playbook not found')

  const vRes = await retoolDb.query<PlaybookVersion>(
    `SELECT * FROM sdr_playbook_versions WHERE playbook_id = $1 ORDER BY version_number ASC`,
    [pid]
  )
  const versions = vRes.data
  const ids = versions.map((v) => v.id)

  const draftCounts = ids.length
    ? await retoolDb.query<{ pvid: number; n: number }>(
        `SELECT playbook_version_id AS pvid, COUNT(*)::int AS n
         FROM sdr_drafts WHERE playbook_version_id = ANY($1) GROUP BY playbook_version_id`,
        [ids]
      )
    : { data: [] as { pvid: number; n: number }[] }

  const overridden = ids.length
    ? await retoolDb.query<{ pvid: number; n: number }>(
        `SELECT d.playbook_version_id AS pvid, COUNT(DISTINCT o.draft_id)::int AS n
         FROM sdr_overrides o JOIN sdr_drafts d ON o.draft_id = d.id
         WHERE d.playbook_version_id = ANY($1) GROUP BY d.playbook_version_id`,
        [ids]
      )
    : { data: [] as { pvid: number; n: number }[] }

  const reasons = ids.length
    ? await retoolDb.query<{ pvid: number; reason: string; n: number }>(
        `SELECT d.playbook_version_id AS pvid, COALESCE(o.reason_code, 'Uncoded') AS reason, COUNT(*)::int AS n
         FROM sdr_overrides o JOIN sdr_drafts d ON o.draft_id = d.id
         WHERE d.playbook_version_id = ANY($1)
         GROUP BY d.playbook_version_id, COALESCE(o.reason_code, 'Uncoded')`,
        [ids]
      )
    : { data: [] as { pvid: number; reason: string; n: number }[] }

  const draftMap = new Map(draftCounts.data.map((r) => [r.pvid, r.n]))
  const ovMap = new Map(overridden.data.map((r) => [r.pvid, r.n]))
  const reasonMap = new Map<number, { reason: string; count: number }[]>()
  for (const r of reasons.data) {
    const arr = reasonMap.get(r.pvid) ?? []
    arr.push({ reason: r.reason, count: r.n })
    reasonMap.set(r.pvid, arr)
  }

  const enriched: VersionAnalytics[] = versions.map((v) => {
    const dc = draftMap.get(v.id) ?? 0
    const oc = ovMap.get(v.id) ?? 0
    return {
      ...v,
      draft_count: dc,
      overridden_count: oc,
      override_rate: dc > 0 ? oc / dc : null,
      reasons: (reasonMap.get(v.id) ?? []).sort((a, b) => b.count - a.count),
      delta: { prev_version_number: null, value: null, enough_data: false },
    }
  })

  // version-over-version delta vs the immediately preceding version (ascending order)
  for (let i = 1; i < enriched.length; i++) {
    const cur = enriched[i]!
    const prev = enriched[i - 1]!
    const enough = cur.draft_count >= MIN_SAMPLE_SIZE && prev.draft_count >= MIN_SAMPLE_SIZE
    let value: number | null = null
    if (enough && prev.override_rate != null && prev.override_rate > 0 && cur.override_rate != null) {
      value = (prev.override_rate - cur.override_rate) / prev.override_rate
    }
    cur.delta = { prev_version_number: prev.version_number, value, enough_data: enough }
  }

  return { playbook, threshold: MIN_SAMPLE_SIZE, versions: enriched }
}
