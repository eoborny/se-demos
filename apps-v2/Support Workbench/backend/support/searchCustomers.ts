type Params = { query?: string }

export default async function searchCustomers(req: { params: Params; user: User }) {
  const q = (req.params?.query ?? '').trim()
  const pat = `%${q}%`
  const result = await retoolDb.query(
    `SELECT id, email, name, company, plan_tier, account_id, stripe_customer_id, notes, created_at
     FROM support_customers
     WHERE ($1 = '' OR email ILIKE $2 OR account_id ILIKE $3 OR company ILIKE $4 OR name ILIKE $5)
     ORDER BY name ASC
     LIMIT 100`,
    [q, pat, pat, pat, pat],
  )
  return result.data
}
