type Params = { query?: string }

export default async function searchEmployees(req: { params: Params; user: User }) {
  const q = (req.params?.query ?? '').trim()
  const pat = `%${q}%`
  const result = await retoolDb.query(
    `SELECT id, email, name, department, manager_email, location, created_at
     FROM support_employees
     WHERE ($1 = '' OR email ILIKE $2 OR name ILIKE $3)
     ORDER BY name ASC
     LIMIT 100`,
    [q, pat, pat],
  )
  return result.data
}
