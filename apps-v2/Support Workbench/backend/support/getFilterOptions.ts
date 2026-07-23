export default async function getFilterOptions(_req: { params: unknown; user: User }) {
  const assignees = await retoolDb.query(
    `SELECT DISTINCT assignee_email FROM support_tickets
     WHERE assignee_email IS NOT NULL ORDER BY assignee_email ASC`,
  )
  const categories = await retoolDb.query(
    `SELECT DISTINCT category FROM support_tickets ORDER BY category ASC`,
  )
  return {
    assignees: assignees.data.map((r) => (r as { assignee_email: string }).assignee_email),
    categories: categories.data.map((r) => (r as { category: string }).category),
  }
}
