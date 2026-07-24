import type { ReactNode } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '../../lib/shadcn/card'
import type { DashboardStats } from '../../utils/types'
import { statusLabel, categoryLabel, CHART_COLORS, PRIORITY_COLORS } from '../../utils/support'

const FALLBACK = '#6366f1'
function color(i: number): string {
  return CHART_COLORS[i % CHART_COLORS.length] ?? FALLBACK
}

const axisStyle = { fontSize: 12, fill: 'hsl(var(--muted-foreground))' }
const tooltipStyle = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
  color: 'hsl(var(--popover-foreground))',
  fontSize: 12,
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="shadow-retool-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function DashboardCharts({ stats }: { stats: DashboardStats }) {
  const workloadData = stats.workload.map((w) => ({
    name: w.assignee.replace('@cursor.com', ''),
    Open: w.open,
    Resolved: w.total - w.open,
  }))

  const priorityData = stats.priorityBreakdown.map((p) => ({ name: p.priority, value: p.count }))
  const statusData = stats.statusBreakdown.map((s) => ({ name: statusLabel(s.status), value: s.count }))
  const categoryData = stats.categoryBreakdown.map((c) => ({ name: categoryLabel(c.category), value: c.count }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard title="Workload by assignee">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={workloadData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="name" tick={axisStyle} tickLine={false} axisLine={false} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Open" stackId="a" fill={color(0)} radius={[0, 0, 0, 0]} />
            <Bar dataKey="Resolved" stackId="a" fill={color(2)} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Tickets by priority">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={priorityData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
              labelLine={false}
            >
              {priorityData.map((entry) => (
                <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] ?? FALLBACK} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Tickets by status">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={statusData}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="name"
              tick={axisStyle}
              tickLine={false}
              axisLine={false}
              width={120}
            />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
            <Bar dataKey="value" name="Tickets" fill={color(1)} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Tickets by category">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={categoryData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="name" tick={axisStyle} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
            <Bar dataKey="value" name="Tickets" radius={[4, 4, 0, 0]}>
              {categoryData.map((entry, i) => (
                <Cell key={entry.name} fill={color(i)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
