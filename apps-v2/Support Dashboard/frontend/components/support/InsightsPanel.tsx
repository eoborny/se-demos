import { AlertTriangle, ArrowUpCircle, UserX, Timer, CheckCircle2, Scale } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../lib/shadcn/card'
import { Button } from '../../lib/shadcn/button'
import type { DashboardStats } from '../../utils/types'
import { formatDuration } from '../../utils/support'

type Severity = 'critical' | 'warning' | 'positive'

type Insight = {
  id: string
  severity: Severity
  icon: LucideIcon
  title: string
  detail: string
  action?: { label: string; filter: Record<string, string> }
}

const severityStyles: Record<Severity, string> = {
  critical: 'border-l-destructive bg-destructive/5',
  warning: 'border-l-warning bg-warning/5',
  positive: 'border-l-success bg-success/5',
}

const iconStyles: Record<Severity, string> = {
  critical: 'text-destructive',
  warning: 'text-warning',
  positive: 'text-success',
}

function buildInsights(stats: DashboardStats): Insight[] {
  const insights: Insight[] = []

  if (stats.slaBreached > 0) {
    insights.push({
      id: 'sla',
      severity: 'critical',
      icon: AlertTriangle,
      title: `${stats.slaBreached} ticket${stats.slaBreached > 1 ? 's have' : ' has'} breached SLA`,
      detail: 'These open tickets are past their SLA due date. Reassign or escalate to recover.',
      action: { label: 'Review breached', filter: { status: 'Escalated' } },
    })
  }

  if (stats.escalatedTickets > 0) {
    insights.push({
      id: 'escalated',
      severity: 'critical',
      icon: ArrowUpCircle,
      title: `${stats.escalatedTickets} escalated ticket${stats.escalatedTickets > 1 ? 's' : ''}`,
      detail: 'Escalations need manager attention and may require cross-team coordination.',
      action: { label: 'View escalated', filter: { status: 'Escalated' } },
    })
  }

  if (stats.urgentOpen > 0) {
    insights.push({
      id: 'urgent',
      severity: 'warning',
      icon: AlertTriangle,
      title: `${stats.urgentOpen} urgent ticket${stats.urgentOpen > 1 ? 's' : ''} still open`,
      detail: 'Prioritize urgent tickets to protect customer experience.',
      action: { label: 'View urgent', filter: { priority: 'Urgent' } },
    })
  }

  // Workload imbalance detection.
  const active = stats.workload.filter((w) => w.assignee !== 'Unassigned')
  if (active.length > 1) {
    const sorted = [...active].sort((a, b) => b.open - a.open)
    const top = sorted[0]!
    const avg = active.reduce((s, w) => s + w.open, 0) / active.length
    if (top.open > avg * 1.5 && top.open >= 4) {
      insights.push({
        id: 'workload',
        severity: 'warning',
        icon: Scale,
        title: `${top.assignee.replace('@cursor.com', '')} is overloaded`,
        detail: `Handling ${top.open} open tickets vs. a team average of ${avg.toFixed(1)}. Consider rebalancing.`,
        action: { label: 'View their queue', filter: { assignee: top.assignee } },
      })
    }
  }

  if (stats.unassignedOpen > 0) {
    insights.push({
      id: 'unassigned',
      severity: 'warning',
      icon: UserX,
      title: `${stats.unassignedOpen} open ticket${stats.unassignedOpen > 1 ? 's are' : ' is'} unassigned`,
      detail: 'Assign an owner so these tickets start moving.',
    })
  }

  if (stats.avgHandlingMinutes !== null) {
    insights.push({
      id: 'handling',
      severity: 'positive',
      icon: Timer,
      title: `Average handling time is ${formatDuration(stats.avgHandlingMinutes)}`,
      detail: `Median resolution is ${formatDuration(stats.medianHandlingMinutes)} across ${stats.resolvedTickets} closed tickets.`,
    })
  }

  if (insights.length === 0) {
    insights.push({
      id: 'clear',
      severity: 'positive',
      icon: CheckCircle2,
      title: 'Everything looks healthy',
      detail: 'No SLA breaches, escalations, or workload imbalances detected.',
    })
  }

  return insights
}

export function InsightsPanel({
  stats,
  onAction,
}: {
  stats: DashboardStats
  onAction: (filter: Record<string, string>) => void
}) {
  const insights = buildInsights(stats)

  return (
    <Card className="shadow-retool-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Actionable insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight) => {
          const Icon = insight.icon
          return (
            <div
              key={insight.id}
              className={`flex items-start gap-3 rounded-md border-l-4 border border-border p-3 ${severityStyles[insight.severity]}`}
            >
              <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconStyles[insight.severity]}`} />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm">{insight.title}</div>
                <div className="text-sm text-muted-foreground">{insight.detail}</div>
              </div>
              {insight.action && (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => onAction(insight.action!.filter)}
                >
                  {insight.action.label}
                </Button>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
