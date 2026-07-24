// List support managers plus the distinct assignee emails currently used on tickets.

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

export default async function getAgents(): Promise<AgentsResult> {
  const agents = await retoolDb.query<Agent>(
    `SELECT id, name, email, role FROM support_agents ORDER BY name`,
  )
  const emails = await retoolDb.query<{ assignee_email: string }>(
    `SELECT DISTINCT assignee_email FROM support_tickets WHERE assignee_email IS NOT NULL ORDER BY assignee_email`,
  )
  return {
    agents: agents.data,
    assigneeEmails: emails.data.map((r) => r.assignee_email),
  }
}
