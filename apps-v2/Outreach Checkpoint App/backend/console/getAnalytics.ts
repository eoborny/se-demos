type Params = { playbookVersionId?: number | 'legacy' | 'all' }

// Aggregates override patterns + draft status distribution for the analytics dashboard.
// Supports filtering by a specific playbook version (or the legacy/unversioned bucket),
// and always returns a per-version breakdown for group-by.
export default async function getAnalytics(req: { params: Params }) {
  const pv = req.params.playbookVersionId
  const isVersion = typeof pv === 'number'
  const isLegacy = pv === 'legacy'

  // WHERE fragment + args for override-based queries (overrides o JOIN drafts d)
  const ovArgs: unknown[] = []
  let ovWhere = ''
  if (isVersion) {
    ovArgs.push(pv)
    ovWhere = `WHERE d.playbook_version_id = $1`
  } else if (isLegacy) {
    ovWhere = `WHERE d.playbook_version_id IS NULL`
  }
  const ovFrom = `FROM sdr_overrides o JOIN sdr_drafts d ON o.draft_id = d.id ${ovWhere}`

  // WHERE fragment + args for draft-based queries
  const drArgs: unknown[] = []
  let drWhere = ''
  if (isVersion) {
    drArgs.push(pv)
    drWhere = `WHERE playbook_version_id = $1`
  } else if (isLegacy) {
    drWhere = `WHERE playbook_version_id IS NULL`
  }

  const totals = await retoolDb.query<{ edits: number; rejects: number }>(
    `SELECT COUNT(*) FILTER (WHERE o.type = 'edit')::int AS edits,
            COUNT(*) FILTER (WHERE o.type = 'reject')::int AS rejects ${ovFrom}`,
    ovArgs
  )

  const statusDist = await retoolDb.query<{ status: string; count: number }>(
    `SELECT status, COUNT(*)::int AS count FROM sdr_drafts ${drWhere} GROUP BY status ORDER BY count DESC`,
    drArgs
  )

  const byReason = await retoolDb.query<{ reason: string; count: number }>(
    `SELECT COALESCE(o.reason_code, 'Uncoded edit') AS reason, COUNT(*)::int AS count ${ovFrom} GROUP BY reason ORDER BY count DESC`,
    ovArgs
  )

  const byRep = await retoolDb.query<{ rep: string; edits: number; rejects: number }>(
    `SELECT o.rep_name AS rep,
       COUNT(*) FILTER (WHERE o.type = 'edit')::int AS edits,
       COUNT(*) FILTER (WHERE o.type = 'reject')::int AS rejects
     ${ovFrom} GROUP BY o.rep_name ORDER BY (COUNT(*)) DESC`,
    ovArgs
  )

  const bySegment = await retoolDb.query<{ segment: string; count: number }>(
    `SELECT o.account_segment AS segment, COUNT(*)::int AS count ${ovFrom} GROUP BY o.account_segment ORDER BY count DESC`,
    ovArgs
  )

  const byType = await retoolDb.query<{ type: string; count: number }>(
    `SELECT o.outreach_type AS type, COUNT(*)::int AS count ${ovFrom} GROUP BY o.outreach_type ORDER BY count DESC`,
    ovArgs
  )

  const draftCounts = await retoolDb.query<{ total: number; approved_no_edit: number; edited: number }>(
    `SELECT COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status = 'Approved')::int AS approved_no_edit,
       COUNT(*) FILTER (WHERE status = 'Edited & Approved')::int AS edited
     FROM sdr_drafts ${drWhere}`,
    drArgs
  )

  // Per-version breakdown for group-by (always full, ignoring filter)
  const versionRows = await retoolDb.query<{
    version_id: number
    version_number: number
    playbook_name: string
    status: string
    drafts: number
    overridden: number
  }>(
    `SELECT pv.id AS version_id, pv.version_number, pb.name AS playbook_name, pv.status,
       COUNT(DISTINCT d.id)::int AS drafts,
       COUNT(DISTINCT o.draft_id)::int AS overridden
     FROM sdr_playbook_versions pv
     JOIN sdr_playbooks pb ON pv.playbook_id = pb.id
     LEFT JOIN sdr_drafts d ON d.playbook_version_id = pv.id
     LEFT JOIN sdr_overrides o ON o.draft_id = d.id
     GROUP BY pv.id, pv.version_number, pb.name, pv.status
     ORDER BY pb.name, pv.version_number`
  )
  const legacyRow = await retoolDb.query<{ drafts: number; overridden: number }>(
    `SELECT COUNT(DISTINCT d.id)::int AS drafts, COUNT(DISTINCT o.draft_id)::int AS overridden
     FROM sdr_drafts d LEFT JOIN sdr_overrides o ON o.draft_id = d.id
     WHERE d.playbook_version_id IS NULL`
  )

  const byVersion = versionRows.data.map((v) => ({
    versionId: v.version_id as number | 'legacy',
    label: `${v.playbook_name} · v${v.version_number}`,
    status: v.status,
    drafts: v.drafts,
    overrideRate: v.drafts > 0 ? v.overridden / v.drafts : null,
  }))
  const lr = legacyRow.data[0]
  if (lr && lr.drafts > 0) {
    byVersion.push({
      versionId: 'legacy',
      label: 'Legacy / Unversioned',
      status: 'legacy',
      drafts: lr.drafts,
      overrideRate: lr.drafts > 0 ? lr.overridden / lr.drafts : null,
    })
  }

  const t = totals.data[0] ?? { edits: 0, rejects: 0 }
  const dc = draftCounts.data[0] ?? { total: 0, approved_no_edit: 0, edited: 0 }
  const decided = dc.approved_no_edit + dc.edited
  const approvalNoEditRate = decided > 0 ? Math.round((dc.approved_no_edit / decided) * 100) : 0

  return {
    totals: {
      edits: t.edits,
      rejects: t.rejects,
      totalOverrides: t.edits + t.rejects,
      approvalNoEditRate,
    },
    statusDistribution: statusDist.data,
    byReason: byReason.data,
    byRep: byRep.data,
    bySegment: bySegment.data,
    byType: byType.data,
    byVersion,
  }
}
