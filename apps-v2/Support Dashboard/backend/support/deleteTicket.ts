// Delete a support ticket by id.

type Params = { id: number }

export default async function deleteTicket(req: { params: Params }): Promise<{ id: number }> {
  const { id } = req.params
  if (!id) throw new Error('Ticket id is required')
  const result = await retoolDb.query<{ id: number }>(
    `DELETE FROM support_tickets WHERE id = $1 RETURNING id`,
    [id],
  )
  if (result.data.length === 0) throw new Error(`Ticket ${id} not found`)
  return result.data[0]!
}
