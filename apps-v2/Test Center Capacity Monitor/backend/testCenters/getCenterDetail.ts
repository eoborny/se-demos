interface Params {
  centerId: string
}

export default async function (req: { params: Params }) {
  const { centerId } = req.params

  const trend = await retoolDb.query(
    `SELECT snapshot_date AS date, seats
       FROM booking_trend
      WHERE center_id = $1
      ORDER BY snapshot_date`,
    [centerId],
  )

  const past = await retoolDb.query(
    `SELECT session_date AS date, fill_rate::float AS "fillRate"
       FROM past_sessions
      WHERE center_id = $1
      ORDER BY session_date`,
    [centerId],
  )

  const notes = await retoolDb.query(
    `SELECT id, center_id AS "centerId", author, kind,
            note_text AS text, created_at AS timestamp
       FROM center_notes
      WHERE center_id = $1
      ORDER BY created_at DESC`,
    [centerId],
  )

  return {
    bookingTrend: trend.data,
    pastSessions: past.data,
    notes: notes.data,
  }
}
