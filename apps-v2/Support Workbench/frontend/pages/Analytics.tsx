import { useEffect, useMemo, useState } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from 'recharts'
import { NativeSelect } from '../lib/shadcn/native-select'
import { Label } from '../lib/shadcn/label'
import {
  useGetAnalyticsKPIs,
  useGetTicketsOverTime,
  useGetTicketsByCategory,
  useGetOpenTicketsByAssignee,
  useGetTicketsByStatus,
  useGetOpenTicketsByType,
  useGetSlaCompliance,
} from '../hooks/backend/support'
import { C, CHART, chartStatusColor, statusLabel } from '../lib/cursor'
import { ChartCard } from '../components/analytics/ChartCard'
import { ManagerKpis, type AnalyticsKPIs } from '../components/analytics/ManagerKpis'

type OverTimeRow = { date: string; created: number; resolved: number; open: number }
type CountRow = { category?: string; assignee?: string; status?: string; type?: string; count: number }
type SlaRow = { total: number; met: number; breached: number; pct: number | null; range_days: number }

const tooltipStyle = {
  backgroundColor: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  fontSize: 12,
  color: C.text,
}
const axisTick = { fontSize: 11, fill: C.muted }

function shortDate(d: string): string {
  const parts = d.split('-')
  if (parts.length === 3) return `${Number(parts[1])}/${Number(parts[2])}`
  return d
}

export default function Analytics() {
  const [dateRange, setDateRange] = useState('7d')
  const [ticketType, setTicketType] = useState('All')

  const kpisFn = useGetAnalyticsKPIs()
  const overTimeFn = useGetTicketsOverTime()
  const byCatFn = useGetTicketsByCategory()
  const byAssigneeFn = useGetOpenTicketsByAssignee()
  const byStatusFn = useGetTicketsByStatus()
  const byTypeFn = useGetOpenTicketsByType()
  const slaFn = useGetSlaCompliance()

  useEffect(() => {
    const args = { dateRange, ticketType }
    void kpisFn.trigger(args, { skipCache: true })
    void overTimeFn.trigger(args, { skipCache: true })
    void byCatFn.trigger({ dateRange, ticketType, openOnly: true }, { skipCache: true })
    void byAssigneeFn.trigger({ ticketType }, { skipCache: true })
    void byStatusFn.trigger({ ticketType }, { skipCache: true })
    void byTypeFn.trigger({}, { skipCache: true })
    void slaFn.trigger(args, { skipCache: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, ticketType])

  const kpis = (kpisFn.data as AnalyticsKPIs | null) ?? null
  const overTime = ((overTimeFn.data as OverTimeRow[] | undefined) ?? []).map((r) => ({
    ...r,
    label: shortDate(r.date),
  }))
  const byCat = (byCatFn.data as CountRow[] | undefined) ?? []
  const byAssignee = (byAssigneeFn.data as CountRow[] | undefined) ?? []
  const byStatus = ((byStatusFn.data as CountRow[] | undefined) ?? []).map((r) => ({
    name: statusLabel(r.status ?? ''),
    status: r.status ?? '',
    value: r.count,
  }))
  const byType = ((byTypeFn.data as CountRow[] | undefined) ?? []).map((r) => ({
    name: (r.type ?? '').charAt(0).toUpperCase() + (r.type ?? '').slice(1),
    type: r.type ?? '',
    value: r.count,
  }))
  const sla = (slaFn.data as SlaRow | null) ?? null

  const slaColor = useMemo(() => {
    if (!sla || sla.pct == null) return C.muted
    if (sla.pct >= 90) return CHART.green
    if (sla.pct >= 75) return CHART.gold
    return C.error
  }, [sla])

  const rangeLabel = dateRange === '7d' ? 'last 7 days' : dateRange === '90d' ? 'last 90 days' : 'last 30 days'

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: C.text }}>
            Analytics
          </h1>
          <p className="text-sm" style={{ color: C.muted }}>
            Manager overview of support volume, workload, and SLA performance.
          </p>
        </div>
        <div className="flex items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="a-range" className="text-xs font-medium" style={{ color: C.muted }}>
              Date range
            </Label>
            <NativeSelect
              id="a-range"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-40"
              style={{ backgroundColor: C.surface, borderColor: C.border, color: C.text }}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a-type" className="text-xs font-medium" style={{ color: C.muted }}>
              Ticket type
            </Label>
            <NativeSelect
              id="a-type"
              value={ticketType}
              onChange={(e) => setTicketType(e.target.value)}
              className="w-36"
              style={{ backgroundColor: C.surface, borderColor: C.border, color: C.text }}
            >
              <option value="All">All</option>
              <option value="external">External</option>
              <option value="internal">Internal</option>
            </NativeSelect>
          </div>
        </div>
      </div>

      <ManagerKpis kpis={kpis} loading={kpisFn.loading} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Tickets over time */}
        <div className="xl:col-span-2">
          <ChartCard
            title="Tickets Over Time"
            subtitle={`Created, resolved, and open — ${rangeLabel}`}
            loading={overTimeFn.loading && overTime.length === 0}
            empty={!overTimeFn.loading && overTime.length === 0}
          >
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={overTime} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART.orange} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={CHART.orange} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART.green} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART.green} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gOpen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART.blue} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART.blue} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="label" tick={axisTick} stroke={C.border} />
                <YAxis allowDecimals={false} tick={axisTick} stroke={C.border} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="created" name="Created" stroke={CHART.orange} strokeWidth={2} fill="url(#gCreated)" />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke={CHART.green} strokeWidth={2} fill="url(#gResolved)" />
                <Area type="monotone" dataKey="open" name="Open" stroke={CHART.blue} strokeWidth={2} fill="url(#gOpen)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Tickets by category */}
        <ChartCard
          title="Open Tickets by Category"
          subtitle="Current open tickets grouped by category"
          loading={byCatFn.loading && byCat.length === 0}
          empty={!byCatFn.loading && byCat.length === 0}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byCat} layout="vertical" margin={{ top: 4, right: 24, left: 12, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={axisTick} stroke={C.border} />
              <YAxis type="category" dataKey="category" width={90} tick={axisTick} stroke={C.border} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(245,78,0,0.06)' }} />
              <Bar dataKey="count" name="Open" fill={CHART.orange} radius={[0, 4, 4, 0]}>
                <LabelList dataKey="count" position="right" style={{ fontSize: 11, fill: C.muted }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Open tickets by assignee */}
        <ChartCard
          title="Open Tickets by Assignee"
          subtitle="Workload distribution across agents"
          loading={byAssigneeFn.loading && byAssignee.length === 0}
          empty={!byAssigneeFn.loading && byAssignee.length === 0}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byAssignee} margin={{ top: 4, right: 12, left: -12, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="assignee" tick={axisTick} stroke={C.border} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} tick={axisTick} stroke={C.border} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(107,163,229,0.10)' }} />
              <Bar dataKey="count" name="Open tickets" fill={CHART.blue} radius={[4, 4, 0, 0]}>
                <LabelList dataKey="count" position="top" style={{ fontSize: 11, fill: C.muted }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Tickets by status */}
        <ChartCard
          title="Tickets by Status"
          subtitle="All tickets by current status"
          loading={byStatusFn.loading && byStatus.length === 0}
          empty={!byStatusFn.loading && byStatus.length === 0}
        >
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={byStatus}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={95}
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
                style={{ fontSize: 11 }}
              >
                {byStatus.map((entry) => (
                  <Cell key={entry.status} fill={chartStatusColor(entry.status)} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Tickets by type (donut) */}
        <ChartCard
          title="Open Tickets by Type"
          subtitle="External vs Internal"
          loading={byTypeFn.loading && byType.length === 0}
          empty={!byTypeFn.loading && byType.length === 0}
        >
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={byType}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
                style={{ fontSize: 12 }}
              >
                {byType.map((entry) => (
                  <Cell key={entry.type} fill={entry.type === 'external' ? CHART.orange : CHART.blue} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* SLA compliance */}
        <ChartCard
          title="SLA Compliance"
          subtitle={`Resolved before SLA — ${rangeLabel}`}
          loading={slaFn.loading && !sla}
          empty={!slaFn.loading && (!sla || sla.total === 0)}
          emptyLabel="No resolved tickets in this range."
        >
          <div className="flex items-center gap-4">
            <div className="relative" style={{ width: 200, height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="72%"
                  outerRadius="100%"
                  data={[{ name: 'SLA', value: sla?.pct ?? 0, fill: slaColor }]}
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar background={{ fill: C.bgSecondary }} dataKey="value" cornerRadius={999} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-semibold" style={{ color: C.text }}>
                  {sla?.pct != null ? `${sla.pct}%` : '—'}
                </span>
                <span className="text-xs" style={{ color: C.muted }}>
                  compliant
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-2xl font-semibold" style={{ color: CHART.green }}>
                  {sla?.met ?? 0}
                </div>
                <div className="text-xs" style={{ color: C.muted }}>
                  Met SLA
                </div>
              </div>
              <div>
                <div className="text-2xl font-semibold" style={{ color: C.error }}>
                  {sla?.breached ?? 0}
                </div>
                <div className="text-xs" style={{ color: C.muted }}>
                  Breached SLA
                </div>
              </div>
              <div>
                <div className="text-2xl font-semibold" style={{ color: C.text }}>
                  {sla?.total ?? 0}
                </div>
                <div className="text-xs" style={{ color: C.muted }}>
                  Resolved total
                </div>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  )
}
