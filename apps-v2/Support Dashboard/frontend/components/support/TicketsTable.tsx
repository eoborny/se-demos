import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowUpDown, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../lib/shadcn/table'
import { Button } from '../../lib/shadcn/button'
import { PriorityBadge, StatusBadge } from './Badges'
import type { Ticket } from '../../utils/types'
import { categoryLabel, formatDate, formatDateTime } from '../../utils/support'

type Props = {
  tickets: Ticket[]
  onEdit: (ticket: Ticket) => void
  onDelete: (ticket: Ticket) => void
}

export function TicketsTable({ tickets, onEdit, onDelete }: Props) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'created_at', desc: true }])

  const columns = useMemo<ColumnDef<Ticket>[]>(
    () => [
      {
        accessorKey: 'ticket_number',
        header: 'Ticket',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">{row.original.ticket_number}</span>
        ),
      },
      {
        accessorKey: 'subject',
        header: ({ column }) => (
          <SortHeader label="Subject" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} />
        ),
        cell: ({ row }) => (
          <div className="max-w-xs">
            <div className="font-medium truncate">{row.original.subject}</div>
            <div className="text-xs text-muted-foreground truncate">
              {categoryLabel(row.original.category)} · {row.original.ticket_type}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'priority',
        header: ({ column }) => (
          <SortHeader label="Priority" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} />
        ),
        cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
        sortingFn: (a, b) => {
          const order = ['Low', 'Medium', 'High', 'Urgent']
          return order.indexOf(a.original.priority) - order.indexOf(b.original.priority)
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <SortHeader label="Status" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} />
        ),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'assignee_email',
        header: 'Assignee',
        cell: ({ row }) =>
          row.original.assignee_email ? (
            <span className="text-sm">{row.original.assignee_email}</span>
          ) : (
            <span className="text-sm text-muted-foreground italic">Unassigned</span>
          ),
      },
      {
        accessorKey: 'sla_due_at',
        header: 'SLA due',
        cell: ({ row }) => {
          const due = row.original.sla_due_at
          const open = !['Resolved', 'Closed'].includes(row.original.status)
          const breached = due && open && new Date(due).getTime() < Date.now()
          return (
            <span className={breached ? 'text-sm text-destructive font-medium' : 'text-sm text-muted-foreground'}>
              {formatDateTime(due)}
            </span>
          )
        },
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => (
          <SortHeader label="Created" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} />
        ),
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.created_at)}</span>,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Edit ticket"
              onClick={() => onEdit(row.original)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete ticket"
              onClick={() => onDelete(row.original)}
            >
              <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        ),
      },
    ],
    [onEdit, onDelete],
  )

  const table = useReactTable({
    data: tickets,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function SortHeader({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {label}
      <ArrowUpDown className="w-3 h-3" />
    </button>
  )
}
