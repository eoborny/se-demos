import { useEffect, useState, useCallback } from 'react'
import { Search, Download, ScrollText, Loader2 } from 'lucide-react'
import { useGetAuditLog } from '../hooks/backend/console'
import { Input } from '../lib/shadcn/input'
import { Button } from '../lib/shadcn/button'
import { Badge } from '../lib/shadcn/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../lib/shadcn/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../lib/shadcn/table'
import { BadgeVariant } from '../lib/console/types'

type AuditRow = {
  id: number
  draft_id: number | null
  account_name: string | null
  actor: string
  actor_role: string | null
  action: string
  before_state: string | null
  after_state: string | null
  detail: string | null
  created_at: string
}

const ACTION_VARIANT: Record<string, BadgeVariant> = {
  view: 'outline',
  edit: 'secondary',
  approve: 'success',
  reject: 'destructive',
  route: 'warning',
  send: 'default',
  reassign: 'secondary',
  config: 'outline',
}

const ACTIONS = ['all', 'view', 'edit', 'approve', 'reject', 'route', 'send', 'reassign', 'config']

export default function AuditLogPage() {
  const { data, loading, trigger } = useGetAuditLog()
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('all')

  const load = useCallback(() => {
    void trigger({ search, action }, { skipCache: true })
  }, [trigger, search, action])

  useEffect(() => { load() }, [load])

  const rows = (data as AuditRow[] | undefined) ?? []

  const exportCsv = () => {
    const header = ['Timestamp', 'Actor', 'Role', 'Action', 'Account', 'Before', 'After', 'Detail']
    const escape = (v: string | null) => `"${(v ?? '').replace(/"/g, '""')}"`
    const lines = rows.map((r) =>
      [new Date(r.created_at).toISOString(), r.actor, r.actor_role, r.action, r.account_name, r.before_state, r.after_state, r.detail]
        .map((v) => escape(v == null ? '' : String(v))).join(',')
    )
    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <ScrollText className="h-6 w-6 text-primary" /> Audit Log
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every action — view, edit, approve, reject, route, send — with actor, timestamp, and before/after state.
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={exportCsv} disabled={rows.length === 0}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search actor, account, detail…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ACTIONS.map((a) => <SelectItem key={a} value={a}>{a === 'all' ? 'All actions' : a[0]!.toUpperCase() + a.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-retool-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Timestamp</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead className="w-[110px]">Action</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Change</TableHead>
              <TableHead>Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">No log entries match your filters.</TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-foreground">{r.actor}</div>
                    {r.actor_role && <div className="text-[11px] text-muted-foreground">{r.actor_role}</div>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ACTION_VARIANT[r.action] ?? 'outline'} className="capitalize">{r.action}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-body-foreground">{r.account_name ?? '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.before_state || r.after_state ? (
                      <span>{r.before_state ?? '∅'} <span className="text-foreground">→</span> {r.after_state ?? '∅'}</span>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="max-w-[240px] truncate text-sm text-body-foreground" title={r.detail ?? ''}>{r.detail ?? '—'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{rows.length} entries · exportable for compliance review.</p>
    </div>
  )
}
