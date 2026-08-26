interface Params {
  centerId: string
  kind: 'note' | 'capacity_increase' | 'reassignment'
  text: string
}

export default async function (req: { params: Params; user: User }) {
  const { centerId, kind, text } = req.params
  const author = req.user?.fullName || req.user?.email || 'Ops Staff'
  const id = `${centerId}-${Date.now()}`

  await retoolDb.insert({
    tableName: 'center_notes',
    changeset: {
      id,
      center_id: centerId,
      author,
      kind,
      note_text: text,
    },
  })

  const result = await retoolDb.query(
    `SELECT id, center_id AS "centerId", author, kind,
            note_text AS text, created_at AS timestamp
       FROM center_notes
      WHERE id = $1`,
    [id],
  )
  return result.data[0]
}
