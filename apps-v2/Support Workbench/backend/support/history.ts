// Shared audit-log helper (no default export -> not a serverless entry point)

export type HistoryChange = {
  field: string
  oldValue: string | null
  newValue: string | null
}

/**
 * Append one row per changed field to support_ticket_history.
 */
export async function logHistory(
  ticketId: number,
  changedBy: string,
  changes: HistoryChange[],
): Promise<void> {
  for (const ch of changes) {
    await retoolDb.query(
      `INSERT INTO support_ticket_history
        (ticket_id, field_changed, old_value, new_value, changed_by, changed_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [ticketId, ch.field, ch.oldValue, ch.newValue, changedBy],
    )
  }
}

export const SLA_HOURS_BY_PRIORITY: Record<string, number> = {
  Urgent: 1,
  High: 4,
  Medium: 8,
  Low: 24,
}
