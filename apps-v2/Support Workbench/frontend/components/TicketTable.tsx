import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../lib/shadcn/table'
import { C, formatDateTime, slaCountdown, slaToneColor } from '../lib/cursor'
import type { TicketRow } from '../lib/types'
import { StatusBadge, PriorityBadge } from './Badges'

type SortKey =
  | 'ticket_number'
  | 'ticket_type'
  | 'subject'
  | 'status'
  | 'priority'
  | 'assignee_email'
  | 'sla_due_at'
  | 'created_at'

type Props = {
  tickets: TicketRow[]
  loading: boolean
  onRowClick: (id: number) => void
  selectedId: number | null
}

const PRIORITY_ORDER: Record<string, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 }

const COLUMNS: { key: SortKey; label: string; className?: string }[] = [
  { key: 'ticket_number', label: 'Ticket #' },
  { key: 'ticket_type', label: 'Type' },
  { key: 'subject', label: 'Subject' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'assignee_email', label: 'Assignee' },
  { key: 'sla_due_at', label: 'SLA Due' },
  { key: 'created_at', label: 'Created' },
]

export function TicketTable({ tickets, loading, onRowClick, selectedId }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const sorted = useMemo(() => {
    const copy = [...tickets]
    copy.sort((a, b) => {
      let av: string | number = ''
      let bv: string | number = ''
      if (sortKey === 'priority') {
        av = PRIORITY_ORDER[a.priority] ?? 99
        bv = PRIORITY_ORDER[b.priority] ?? 99
      } else if (sortKey === 'sla_due_at' || sortKey === 'created_at') {
        av = a[sortKey] ? new Date(a[sortKey] as string).getTime() : 0
        bv = b[sortKey] ? new Date(b[sortKey] as string).getTime() : 0
      } else {
        av = (a[sortKey] ?? '').toString().toLowerCase()
        bv = (b[sortKey] ?? '').toString().toLowerCase()
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return copy
  }, [tickets, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: C.surface, borderColor: C.border }}>
      <div className="max-h-[calc(100vh-320px)] overflow-auto cursor-scroll">
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow style={{ backgroundColor: C.bgSecondary }} className="hover:bg-transparent">
              {COLUMNS.map((col) => {
                const active = col.key === sortKey
                return (
                  <TableHead key={col.key} className="whitespace-nowrap" style={{ color: C.muted }}>
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className="inline-flex items-center gap-1 font-semibold text-xs uppercase tracking-wide"
                      style={{ color: active ? C.text : C.muted }}
                      aria-label={`Sort by ${col.label}`}
                    >
                      {col.label}
                      {active ? (
                        sortDir === 'asc' ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </button>
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <TableRow key={`sk-${idx}`}>
                  {COLUMNS.map((col) => (
                    <TableCell key={col.key}>
                      <span
                        className="inline-block h-4 w-full max-w-[120px] animate-pulse rounded"
                        style={{ backgroundColor: C.bgSecondary }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMNS.length} className="text-center py-10" style={{ color: C.muted }}>
                  No tickets match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((t) => {
                const sla = slaCountdown(t.sla_due_at, t.status)
                const isSelected = t.id === selectedId
                return (
                  <TableRow
                    key={t.id}
                    onClick={() => onRowClick(t.id)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onRowClick(t.id)
                      }
                    }}
                    className="cursor-pointer transition-colors"
                    style={{ backgroundColor: isSelected ? 'rgba(245,78,0,0.06)' : undefined }}
                    aria-label={`Open ticket ${t.ticket_number}`}
                  >
                    <TableCell className="font-mono-ticket text-xs font-medium" style={{ color: C.text }}>
                      {t.ticket_number}
                    </TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                        style={{ backgroundColor: C.bgSecondary, color: C.muted }}
                      >
                        {t.ticket_type}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[280px]">
                      <div className="truncate font-medium" style={{ color: C.text }}>
                        {t.subject}
                      </div>
                      <div className="truncate text-xs" style={{ color: C.muted }}>
                        {t.ticket_type === 'external'
                          ? t.customer_company || t.customer_name || 'External'
                          : t.employee_name || 'Internal'}
                        {' · '}
                        {t.category}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={t.status} />
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={t.priority} />
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap" style={{ color: C.text }}>
                      {t.assignee_email ?? <span style={{ color: C.muted }}>Unassigned</span>}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap font-medium" style={{ color: slaToneColor(sla.tone) }}>
                      {sla.text}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap" style={{ color: C.muted }}>
                      {formatDateTime(t.created_at)}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
