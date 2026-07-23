import { Inbox, ShieldAlert, Timer, AlertTriangle, CheckCircle2, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { C } from '../../lib/cursor'

export type AnalyticsKPIs = {
  total_open: number
  sla_at_risk: number
  escalated_open: number
  resolved_today: number
  avg_resolution_hours: number
  first_response_hours: number
  range_days: number
}

type CardDef = {
  label: string
  icon: LucideIcon
  accent: string
  value: (k: AnalyticsKPIs) => string
  sub?: (k: AnalyticsKPIs) => string
}

const CARDS: CardDef[] = [
  { label: 'Total Open Tickets', icon: Inbox, accent: C.text, value: (k) => String(k.total_open) },
  { label: 'SLA At Risk', icon: ShieldAlert, accent: C.warning, value: (k) => String(k.sla_at_risk) },
  {
    label: 'Avg Resolution',
    icon: Timer,
    accent: C.success,
    value: (k) => `${k.avg_resolution_hours}h`,
    sub: (k) => `last ${k.range_days} days`,
  },
  { label: 'Escalated (open)', icon: AlertTriangle, accent: C.error, value: (k) => String(k.escalated_open) },
  { label: 'Resolved Today', icon: CheckCircle2, accent: C.success, value: (k) => String(k.resolved_today) },
  {
    label: 'First Response',
    icon: Zap,
    accent: C.orange,
    value: (k) => `${k.first_response_hours}h`,
    sub: (k) => `last ${k.range_days} days`,
  },
]

export function ManagerKpis({ kpis, loading }: { kpis: AnalyticsKPIs | null; loading: boolean }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {CARDS.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className="rounded-xl border p-4"
            style={{ backgroundColor: C.surface, borderColor: C.border }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide" style={{ color: C.muted }}>
                {card.label}
              </span>
              <Icon className="h-4 w-4" style={{ color: card.accent }} aria-hidden="true" />
            </div>
            <div className="mt-3 text-2xl font-semibold" style={{ color: C.text }}>
              {loading || !kpis ? (
                <span className="inline-block h-7 w-14 animate-pulse rounded" style={{ backgroundColor: C.bgSecondary }} />
              ) : (
                card.value(kpis)
              )}
            </div>
            {!loading && kpis && card.sub && (
              <div className="text-[11px]" style={{ color: C.muted }}>
                {card.sub(kpis)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
