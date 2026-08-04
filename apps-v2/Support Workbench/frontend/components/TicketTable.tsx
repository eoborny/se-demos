import { useMemo, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown, GripVertical } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../lib/shadcn/table'
import { NativeSelect } from '../lib/shadcn/native-select'
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
  assignees: string[]
  onReassign: (id: number, assigneeEmail: string | null) => void
}

const PRIORITY_ORDER: Record<string, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 }

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'ticket_number', label: 'Ticket #' },
  { key: 'ticket_type', label: 'Type' },
  { key: 'subject', label: 'Subject' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'assignee_email', label: 'Assignee' },
  { key: 'sla_due_at', label: 'SLA Due' },
  { key: 'created_at', label: 'Created' },
]

const DEFAULT_ORDER: SortKey[] = COLUMNS.map((c) => c.key)

export function TicketTable({ tickets, loading, onRowClick, selectedId, assignees, onReassign }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [columnOrder, setColumnOrder] = useState<SortKey[]>(DEFAULT_ORDER)
  const [dragKey, setDragKey] = useState<SortKey | null>(null)
  const [overKey, setOverKey] = useState<SortKey | null>(null)

  const orderedColumns = useMemo(
    () =>
      columnOrder
        .map((key) => COLUMNS.find((c) => c.key === key))
        .filter((c): c is { key: SortKey; label: string } => c != null),
    [columnOrder],
  )

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

  const moveColumn = (from: SortKey, to: SortKey) => {
    if (from === to) return
    setColumnOrder((prev) => {
      const next = [...prev]
      const fromIdx = next.indexOf(from)
      const toIdx = next.indexOf(to)
      if (fromIdx < 0 || toIdx < 0) return prev
      next.splice(fromIdx, 1)
      next.splice(toIdx, 0, from)
      return next
    })
  }

  const renderCell = (t: TicketRow, key: SortKey): ReactNode => {
    switch (key) {
      case 'ticket_number':
        return (
          <TableCell key={key} className="font-mono-ticket text-xs font-medium" style={{ color: C.text }}>
            {t.ticket_number}
          </TableCell>
        )
      case 'ticket_type':
        return (
          <TableCell key={key}>
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize"
              style={{ backgroundColor: C.bgSecondary, color: C.muted }}
            >
              {t.ticket_type}
            </span>
          </TableCell>
        )
      case 'subject':
        return (
          <TableCell key={key} className="max-w-[280px]">
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
        )
      case 'status':
        return (
          <TableCell key={key}>
            <StatusBadge status={t.status} />
          </TableCell>
        )
      case 'priority':
        return (
          <TableCell key={key}>
            <PriorityBadge priority={t.priority} />
          </TableCell>
        )
      case 'assignee_email':
        return (
          <TableCell key={key} className="text-sm whitespace-nowrap" style={{ color: C.text }}>
            <NativeSelect
              value={t.assignee_email ?? ''}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation()
                onReassign(t.id, e.target.value || null)
              }}
              className="h-8 w-[180px] text-xs"
              style={{ backgroundColor: C.surface, borderColor: C.border, color: t.assignee_email ? C.text : C.muted }}
              aria-label={`Reassign ticket ${t.ticket_number}`}
            >
              <option value="">Unassigned</option>
              {(t.assignee_email && !assignees.includes(t.assignee_email)
                ? [t.assignee_email, ...assignees]
                : assignees
              ).map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </NativeSelect>
          </TableCell>
        )
      case 'sla_due_at': {
        const sla = slaCountdown(t.sla_due_at, t.status)
        return (
          <TableCell key={key} className="text-sm whitespace-nowrap font-medium" style={{ color: slaToneColor(sla.tone) }}>
            {sla.text}
          </TableCell>
        )
      }
      case 'created_at':
        return (
          <TableCell key={key} className="text-sm whitespace-nowrap" style={{ color: C.muted }}>
            {formatDateTime(t.created_at)}
          </TableCell>
        )
      default:
        return <TableCell key={key} />
    }
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: C.surface, borderColor: C.border }}>
      <div className="max-h-[calc(100vh-320px)] overflow-auto cursor-scroll">
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow style={{ backgroundColor: C.bgSecondary }} className="hover:bg-transparent">
              {orderedColumns.map((col) => {
                const active = col.key === sortKey
                const isOver = overKey === col.key && dragKey != null && dragKey !== col.key
                return (
                  <TableHead
                    key={col.key}
                    className="whitespace-nowrap"
                    style={{
                      color: C.muted,
                      backgroundColor: isOver ? 'rgba(83,58,253,0.10)' : undefined,
                      opacity: dragKey === col.key ? 0.5 : 1,
                    }}
                    draggable
                    onDragStart={(e) => {
                      setDragKey(col.key)
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'move'
                      if (overKey !== col.key) setOverKey(col.key)
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      if (dragKey) moveColumn(dragKey, col.key)
                      setDragKey(null)
                      setOverKey(null)
                    }}
                    onDragEnd={() => {
                      setDragKey(null)
                      setOverKey(null)
                    }}
                  >
                    <div className="inline-flex items-center gap-1">
                      <GripVertical
                        className="h-3.5 w-3.5 cursor-grab active:cursor-grabbing opacity-40 hover:opacity-80"
                        aria-hidden="true"
                      />
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
                    </div>
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <TableRow key={`sk-${idx}`}>
                  {orderedColumns.map((col) => (
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
                <TableCell colSpan={orderedColumns.length} className="text-center py-10" style={{ color: C.muted }}>
                  No tickets match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((t) => {
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
                    style={{ backgroundColor: isSelected ? 'rgba(83,58,253,0.06)' : undefined }}
                    aria-label={`Open ticket ${t.ticket_number}`}
                  >
                    {orderedColumns.map((col) => renderCell(t, col.key))}
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
