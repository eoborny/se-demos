import type { LucideIcon } from 'lucide-react'
import { Ticket, Inbox, Timer, AlertTriangle, ArrowUpCircle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '../../lib/shadcn/card'
import type { DashboardStats } from '../../utils/types'
import { formatDuration } from '../../utils/support'

type Kpi = {
  label: string
  value: string
  hint: string
  icon: LucideIcon
  tone: 'default' | 'warning' | 'destructive' | 'success'
}

const toneClasses: Record<Kpi['tone'], string> = {
  default: 'text-muted-foreground',
  warning: 'text-warning',
  destructive: 'text-destructive',
  success: 'text-success',
}

export function KpiCards({ stats }: { stats: DashboardStats }) {
  const kpis: Kpi[] = [
    {
      label: 'Open tickets',
      value: String(stats.openTickets),
      hint: `${stats.totalTickets} total`,
      icon: Inbox,
      tone: 'default',
    },
    {
      label: 'Avg handling time',
      value: formatDuration(stats.avgHandlingMinutes),
      hint: `median ${formatDuration(stats.medianHandlingMinutes)}`,
      icon: Timer,
      tone: 'default',
    },
    {
      label: 'SLA breached',
      value: String(stats.slaBreached),
      hint: `${stats.slaAtRisk} at risk`,
      icon: AlertTriangle,
      tone: stats.slaBreached > 0 ? 'destructive' : 'success',
    },
    {
      label: 'Urgent open',
      value: String(stats.urgentOpen),
      hint: `${stats.escalatedTickets} escalated`,
      icon: ArrowUpCircle,
      tone: stats.urgentOpen > 0 ? 'warning' : 'default',
    },
    {
      label: 'Resolved',
      value: String(stats.resolvedTickets),
      hint: 'resolved or closed',
      icon: CheckCircle2,
      tone: 'success',
    },
    {
      label: 'Unassigned',
      value: String(stats.unassignedOpen),
      hint: 'open & unassigned',
      icon: Ticket,
      tone: stats.unassignedOpen > 0 ? 'warning' : 'default',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        return (
          <Card key={kpi.label} className="shadow-retool-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{kpi.label}</span>
                <Icon className={`w-4 h-4 ${toneClasses[kpi.tone]}`} />
              </div>
              <div className="mt-2 text-2xl font-bold tabular-nums">{kpi.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{kpi.hint}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
