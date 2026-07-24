// Aggregated KPIs and chart data for the support dashboard.

type StatusCount = { status: string; count: number }
type PriorityCount = { priority: string; count: number }
type CategoryCount = { category: string; count: number }
type WorkloadRow = { assignee: string; open: number; total: number }
type ChannelCount = { channel: string; count: number }

export type DashboardStats = {
  totalTickets: number
  openTickets: number
  resolvedTickets: number
  escalatedTickets: number
  urgentOpen: number
  unassignedOpen: number
  slaBreached: number
  slaAtRisk: number
  avgHandlingMinutes: number | null
  medianHandlingMinutes: number | null
  statusBreakdown: StatusCount[]
  priorityBreakdown: PriorityCount[]
  categoryBreakdown: CategoryCount[]
  workload: WorkloadRow[]
  channelBreakdown: ChannelCount[]
}

const OPEN_STATUSES = ['New', 'Triaged', 'InProgress', 'WaitingOnCustomer', 'WaitingOnInternal', 'Escalated']

export default async function getDashboardStats(): Promise<DashboardStats> {
  const openList = `('${OPEN_STATUSES.join("','")}')`

  const totals = await retoolDb.query<{
    total: number
    open: number
    resolved: number
    escalated: number
    urgent_open: number
    unassigned_open: number
  }>(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status IN ${openList})::int AS open,
      COUNT(*) FILTER (WHERE status IN ('Resolved','Closed'))::int AS resolved,
      COUNT(*) FILTER (WHERE status = 'Escalated')::int AS escalated,
      COUNT(*) FILTER (WHERE priority = 'Urgent' AND status IN ${openList})::int AS urgent_open,
      COUNT(*) FILTER (WHERE assignee_email IS NULL AND status IN ${openList})::int AS unassigned_open
    FROM support_tickets
  `)

  const sla = await retoolDb.query<{ breached: number; at_risk: number }>(`
    SELECT
      COUNT(*) FILTER (WHERE sla_due_at IS NOT NULL AND sla_due_at < now() AND status IN ${openList})::int AS breached,
      COUNT(*) FILTER (WHERE sla_due_at IS NOT NULL AND sla_due_at >= now() AND sla_due_at < now() + interval '4 hours' AND status IN ${openList})::int AS at_risk
    FROM support_tickets
  `)

  const handling = await retoolDb.query<{ avg_min: number | null; median_min: number | null }>(`
    SELECT
      ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60))::int AS avg_min,
      ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60))::int AS median_min
    FROM support_tickets
    WHERE resolved_at IS NOT NULL
  `)

  const status = await retoolDb.query<StatusCount>(`
    SELECT status, COUNT(*)::int AS count FROM support_tickets GROUP BY status ORDER BY count DESC
  `)
  const priority = await retoolDb.query<PriorityCount>(`
    SELECT priority, COUNT(*)::int AS count FROM support_tickets GROUP BY priority
  `)
  const category = await retoolDb.query<CategoryCount>(`
    SELECT category, COUNT(*)::int AS count FROM support_tickets GROUP BY category ORDER BY count DESC
  `)
  const channel = await retoolDb.query<ChannelCount>(`
    SELECT COALESCE(source_channel, 'Unknown') AS channel, COUNT(*)::int AS count
    FROM support_tickets GROUP BY source_channel ORDER BY count DESC
  `)
  const workload = await retoolDb.query<WorkloadRow>(`
    SELECT
      COALESCE(assignee_email, 'Unassigned') AS assignee,
      COUNT(*) FILTER (WHERE status IN ${openList})::int AS open,
      COUNT(*)::int AS total
    FROM support_tickets
    GROUP BY assignee_email
    ORDER BY total DESC
  `)

  const t = totals.data[0]!
  const s = sla.data[0]!
  const h = handling.data[0]!

  return {
    totalTickets: t.total,
    openTickets: t.open,
    resolvedTickets: t.resolved,
    escalatedTickets: t.escalated,
    urgentOpen: t.urgent_open,
    unassignedOpen: t.unassigned_open,
    slaBreached: s.breached,
    slaAtRisk: s.at_risk,
    avgHandlingMinutes: h.avg_min,
    medianHandlingMinutes: h.median_min,
    statusBreakdown: status.data,
    priorityBreakdown: priority.data,
    categoryBreakdown: category.data,
    workload: workload.data,
    channelBreakdown: channel.data,
  }
}
