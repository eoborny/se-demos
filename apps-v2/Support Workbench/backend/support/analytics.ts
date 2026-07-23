// Shared analytics helpers (no default export -> not a serverless entry point)

export function rangeDays(dateRange: string | undefined): number {
  switch (dateRange) {
    case '7d':
      return 7
    case '90d':
      return 90
    case '30d':
    default:
      return 30
  }
}

/**
 * SQL fragment for an optional ticket_type filter. Built ONLY from constants
 * (placeholder indices + a fixed column name) so no user input is ever
 * interpolated into the query string. Uses two DISTINCT placeholders
 * ($firstIndex and $firstIndex+1) so no placeholder is reused. Pair with
 * `typeParams` which supplies exactly two matching param values.
 */
export function typeClauseSql(firstIndex: number, column: string = 'ticket_type'): string {
  return ` AND ($${firstIndex}::text IS NULL OR ${column} = $${firstIndex + 1})`
}

/**
 * The two param values that match `typeClauseSql`. Returns [null, null] when
 * the filter is "All" (or unset), otherwise [type, type].
 */
export function typeParams(ticketType: string | undefined): unknown[] {
  const t = ticketType && ticketType !== 'All' ? ticketType : null
  return [t, t]
}
