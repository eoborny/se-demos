export type TicketRow = {
  id: number
  ticket_number: string
  ticket_type: 'external' | 'internal'
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
  created_at: string | null
  updated_at: string | null
  resolved_at: string | null
  customer_name?: string | null
  customer_company?: string | null
  employee_name?: string | null
  employee_department?: string | null
}

export type TicketDetail = TicketRow & {
  customer_pk: number | null
  customer_email: string | null
  customer_plan_tier: string | null
  customer_account_id: string | null
  customer_stripe_id: string | null
  customer_notes: string | null
  employee_pk: number | null
  employee_email: string | null
  employee_manager: string | null
  employee_location: string | null
}

export type NoteRow = {
  id: number
  ticket_id: number
  author_email: string
  body: string
  is_internal: boolean
  created_at: string
}

export type HistoryRow = {
  id: number
  ticket_id: number
  field_changed: string
  old_value: string | null
  new_value: string | null
  changed_by: string
  changed_at: string
}

export type AISummaryRow = {
  id: number
  ticket_id: number
  summary_text: string
  model: string
  generated_at: string
}

export type CustomerRow = {
  id: number
  email: string
  name: string
  company: string | null
  plan_tier: string | null
  account_id: string | null
  stripe_customer_id: string | null
  notes: string | null
  created_at: string | null
}

export type EmployeeRow = {
  id: number
  email: string
  name: string
  department: string | null
  manager_email: string | null
  location: string | null
  created_at: string | null
}

export type KPIs = {
  open_tickets: number
  urgent_count: number
  avg_resolution_hours: string | number
  sla_at_risk: number
}

export type TicketListRow = {
  id: number
  ticket_number: string
  ticket_type: 'external' | 'internal'
  status: string
  priority: string
  category: string
  subject: string
  assignee_email: string | null
  sla_due_at: string | null
  created_at: string | null
  resolved_at: string | null
}

export type NewTicketPrefill = {
  ticketType?: 'external' | 'internal'
  customerId?: number
  customerLabel?: string
  employeeId?: number
  employeeLabel?: string
}
