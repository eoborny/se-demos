export default async function () {
  const result = await retoolDb.query(
    `SELECT center_id, center_name, city, state, country, test_program,
            capacity_total, seats_booked, session_date, session_time,
            proctor_count, proctor_required, status, lat, lng
       FROM test_centers
       ORDER BY center_name`,
  )
  return result.data
}
