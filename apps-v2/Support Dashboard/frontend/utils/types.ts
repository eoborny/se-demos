// Frontend mirrors of backend function return shapes.

export type Ticket = {
  id: number
  ticket_number: string
  ticket_type: string
  status: string
  priority: string
  category: string
  subject: string
  description: string | null
  assignee_email: string | null
  customer_id: number | null
  employee_id: number | null
  source_channel: string | null
  sla_due_at: string | null
  linear_issue_id: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
}

export type StatusCount = { status: string; count: number }
export type PriorityCount = { priority: string; count: number }
export type CategoryCount = { category: string; count: number }
export type WorkloadRow = { assignee: string; open: number; total: number }
export type ChannelCount = { channel: string; count: number }

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

export type Agent = {
  id: number
  name: string
  email: string
  role: string
}

export type AgentsResult = {
  agents: Agent[]
  assigneeEmails: string[]
}
