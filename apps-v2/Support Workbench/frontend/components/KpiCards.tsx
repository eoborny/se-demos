import { Inbox, AlertTriangle, Timer, ShieldAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { C } from '../lib/cursor'
import type { KPIs } from '../lib/types'

type CardDef = {
  key: keyof KPIs
  label: string
  icon: LucideIcon
  accent: string
  format: (v: KPIs) => string
}

const CARDS: CardDef[] = [
  {
    key: 'open_tickets',
    label: 'Open Tickets',
    icon: Inbox,
    accent: C.text,
    format: (v) => String(v.open_tickets ?? 0),
  },
  {
    key: 'urgent_count',
    label: 'Urgent',
    icon: AlertTriangle,
    accent: C.error,
    format: (v) => String(v.urgent_count ?? 0),
  },
  {
    key: 'avg_resolution_hours',
    label: 'Avg Resolution',
    icon: Timer,
    accent: C.success,
    format: (v) => `${Number(v.avg_resolution_hours ?? 0)}h`,
  },
  {
    key: 'sla_at_risk',
    label: 'SLA At Risk',
    icon: ShieldAlert,
    accent: C.warning,
    format: (v) => String(v.sla_at_risk ?? 0),
  },
]

export function KpiCards({ kpis, loading }: { kpis: KPIs | null; loading: boolean }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.key}
            className="rounded-xl border p-4"
            style={{ backgroundColor: C.surface, borderColor: C.border }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide" style={{ color: C.muted }}>
                {card.label}
              </span>
              <Icon className="h-4 w-4" style={{ color: card.accent }} aria-hidden="true" />
            </div>
            <div className="mt-3 text-3xl font-semibold" style={{ color: C.text }}>
              {loading || !kpis ? (
                <span
                  className="inline-block h-8 w-16 animate-pulse rounded"
                  style={{ backgroundColor: C.bgSecondary }}
                />
              ) : (
                card.format(kpis)
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
