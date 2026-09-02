import { useEffect, useState, useCallback } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { TrendingUp, Pencil, XCircle, Layers, Loader2, Lightbulb, GitBranch } from 'lucide-react'
import { useGetAnalytics, useGetVersionOptions } from '../hooks/backend/console'
import { StatCard } from '../components/console/StatCard'
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from '../lib/shadcn/select'

type ByVersion = { versionId: number | 'legacy'; label: string; status: string; drafts: number; overrideRate: number | null }

type Analytics = {
  totals: { edits: number; rejects: number; totalOverrides: number; approvalNoEditRate: number }
  statusDistribution: { status: string; count: number }[]
  byReason: { reason: string; count: number }[]
  byRep: { rep: string; edits: number; rejects: number }[]
  bySegment: { segment: string; count: number }[]
  byType: { type: string; count: number }[]
  byVersion: ByVersion[]
}

type VersionOptions = {
  versions: { playbook_id: number; playbook_name: string; version_id: number; version_number: number; status: string }[]
  legacyCount: number
}

const CHART = (n: number) => `hsl(var(--chart-${n}))`
const PIE_COLORS = [CHART(1), CHART(2), CHART(3), CHART(4), CHART(5)]

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-retool-sm">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {subtitle && <p className="mb-3 text-xs text-muted-foreground">{subtitle}</p>}
      {children}
    </div>
  )
}

export default function AnalyticsPage() {
  const { data, loading, trigger } = useGetAnalytics()
  const versionOpts = useGetVersionOptions()
  const [filter, setFilter] = useState('all')

  const load = useCallback(() => {
    const playbookVersionId = filter === 'all' ? 'all' : filter === 'legacy' ? 'legacy' : Number(filter)
    void trigger({ playbookVersionId }, { skipCache: true })
  }, [trigger, filter])

  useEffect(() => { load() }, [load])
  useEffect(() => { void versionOpts.trigger({}, { skipCache: true }) }, [versionOpts.trigger])

  const a = data as Analytics | undefined
  const opts = versionOpts.data as VersionOptions | undefined

  if (loading && !a) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading analytics…
      </div>
    )
  }
  if (!a) return null

  const topReason = a.byReason[0]
  // group options by playbook for the select
  const grouped = new Map<string, VersionOptions['versions']>()
  for (const v of opts?.versions ?? []) {
    const arr = grouped.get(v.playbook_name) ?? []
    arr.push(v)
    grouped.set(v.playbook_name, arr)
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Override & Pattern Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Turn daily corrections into a concrete backlog for prompt and playbook tuning.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-muted-foreground" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[260px]"><SelectValue placeholder="Filter by playbook version" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All playbook versions</SelectItem>
              {opts && opts.legacyCount > 0 && (
                <SelectItem value="legacy">Legacy / Unversioned ({opts.legacyCount})</SelectItem>
              )}
              {[...grouped.entries()].map(([name, vers]) => (
                <SelectGroup key={name}>
                  <SelectLabel>{name}</SelectLabel>
                  {vers.map((v) => (
                    <SelectItem key={v.version_id} value={String(v.version_id)}>
                      v{v.version_number} ({v.status})
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Approved without edits" value={`${a.totals.approvalNoEditRate}%`} icon={<TrendingUp className="h-4 w-4" />} accent="success" hint="Rising as prompts improve" />
        <StatCard label="Total edits" value={a.totals.edits} icon={<Pencil className="h-4 w-4" />} accent="primary" />
        <StatCard label="Total rejections" value={a.totals.rejects} icon={<XCircle className="h-4 w-4" />} accent="destructive" />
        <StatCard label="Overrides captured" value={a.totals.totalOverrides} icon={<Layers className="h-4 w-4" />} accent="muted" />
      </div>

      {topReason && (
        <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm text-body-foreground">
            <span className="font-semibold text-foreground">Actionable pattern:</span> “{topReason.reason}” is the most
            common override ({topReason.count} occurrences). A prompt or playbook tweak here would move the approval-without-edit rate the most.
          </p>
        </div>
      )}

      <div className="mb-4 rounded-lg border border-border bg-card p-5 shadow-retool-sm">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground"><GitBranch className="h-4 w-4 text-primary" /> Override rate by playbook version</h3>
        <p className="mb-3 text-xs text-muted-foreground">Group-by view across every version, including the legacy/unversioned bucket. Lower is better.</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={a.byVersion.map((v) => ({ label: v.label, rate: v.overrideRate == null ? 0 : Math.round(v.overrideRate * 1000) / 10, drafts: v.drafts }))} margin={{ bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" angle={-30} textAnchor="end" interval={0} height={70} />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" unit="%" />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--popover-foreground))' }}
              formatter={(val: any, _n: any, item: any) => [`${val}% override (${item?.payload?.drafts ?? 0} drafts)`, 'Rate']}
            />
            <Bar dataKey="rate" fill={CHART(1)} radius={[4, 4, 0, 0]} name="Override rate" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Most common overrides" subtitle="Edits & rejections by reason code">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={a.byReason} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
              <YAxis type="category" dataKey="reason" width={110} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--popover-foreground))' }} />
              <Bar dataKey="count" fill={CHART(1)} radius={[0, 4, 4, 0]} name="Overrides" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Overrides by rep" subtitle="Where corrections concentrate across the team">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={a.byRep}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="rep" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--popover-foreground))' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="edits" stackId="a" fill={CHART(2)} name="Edits" radius={[0, 0, 0, 0]} />
              <Bar dataKey="rejects" stackId="a" fill={CHART(1)} name="Rejections" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Draft status distribution" subtitle="Where drafts land after review">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={a.statusDistribution} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={95} label={(e: any) => `${e.count ?? ''}`}>
                {a.statusDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length] ?? CHART(1)} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--popover-foreground))' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Overrides by segment & type" subtitle="Account segment and outreach channel">
          <div className="grid grid-cols-2 gap-2">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={a.bySegment}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="segment" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--popover-foreground))' }} />
                <Bar dataKey="count" fill={CHART(3)} radius={[4, 4, 0, 0]} name="By segment" />
              </BarChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={a.byType}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="type" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--popover-foreground))' }} />
                <Bar dataKey="count" fill={CHART(4)} radius={[4, 4, 0, 0]} name="By type" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  )
}
