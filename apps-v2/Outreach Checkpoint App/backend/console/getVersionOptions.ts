// Provides the version filter options for the override analytics dashboard.
export default async function getVersionOptions(_req: { params: Record<string, never> }) {
  const rows = await retoolDb.query<{
    playbook_id: number
    playbook_name: string
    version_id: number
    version_number: number
    status: string
  }>(
    `SELECT pb.id AS playbook_id, pb.name AS playbook_name,
       pv.id AS version_id, pv.version_number, pv.status
     FROM sdr_playbook_versions pv
     JOIN sdr_playbooks pb ON pv.playbook_id = pb.id
     ORDER BY pb.name ASC, pv.version_number ASC`
  )

  const legacy = await retoolDb.query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM sdr_drafts WHERE playbook_version_id IS NULL`
  )

  return {
    versions: rows.data,
    legacyCount: legacy.data[0]?.n ?? 0,
  }
}
