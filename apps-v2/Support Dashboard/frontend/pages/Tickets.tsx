import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search, Inbox, X } from 'lucide-react'
import { Button } from '../lib/shadcn/button'
import { Input } from '../lib/shadcn/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../lib/shadcn/select'
import { Skeleton } from '../lib/shadcn/skeleton'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '../lib/shadcn/alert-dialog'
import { toast } from '../lib/shadcn/sonner'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '../lib/shadcn/empty'
import { TicketsTable } from '../components/support/TicketsTable'
import { TicketFormDialog } from '../components/support/TicketFormDialog'
import { useGetTickets, useGetAgents, useDeleteTicket } from '../hooks/backend/support'
import type { Ticket, AgentsResult } from '../utils/types'
import { STATUSES, PRIORITIES, CATEGORIES, statusLabel, categoryLabel } from '../utils/support'

type Filters = {
  status: string
  priority: string
  category: string
  assignee: string
  search: string
}

const DEFAULT_FILTERS: Filters = {
  status: 'all',
  priority: 'all',
  category: 'all',
  assignee: 'all',
  search: '',
}

export default function Tickets() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [searchInput, setSearchInput] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Ticket | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Ticket | null>(null)

  const ticketsHook = useGetTickets()
  const agentsHook = useGetAgents()
  const deleteHook = useDeleteTicket()
  const { trigger: triggerTickets } = ticketsHook
  const { trigger: triggerAgents } = agentsHook

  const tickets = (ticketsHook.data as Ticket[] | undefined) ?? []
  const agents = agentsHook.data as AgentsResult | undefined
  const assigneeEmails = useMemo(() => agents?.assigneeEmails ?? [], [agents])

  // Seed filters from URL params (e.g. arriving from a dashboard insight).
  useEffect(() => {
    const next: Filters = {
      status: searchParams.get('status') ?? 'all',
      priority: searchParams.get('priority') ?? 'all',
      category: searchParams.get('category') ?? 'all',
      assignee: searchParams.get('assignee') ?? 'all',
      search: searchParams.get('search') ?? '',
    }
    setFilters(next)
    setSearchInput(next.search)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadTickets = useCallback(
    (f: Filters) => {
      triggerTickets(
        {
          status: f.status,
          priority: f.priority,
          category: f.category,
          assignee: f.assignee,
          search: f.search,
        },
        { skipCache: true },
      )
    },
    [triggerTickets],
  )

  useEffect(() => {
    triggerAgents()
  }, [triggerAgents])

  useEffect(() => {
    loadTickets(filters)
  }, [filters, loadTickets])

  const updateFilter = (key: keyof Filters, value: string) => {
    const next = { ...filters, [key]: value }
    setFilters(next)
    const params = new URLSearchParams()
    Object.entries(next).forEach(([k, v]) => {
      if (v && v !== 'all') params.set(k, v)
    })
    setSearchParams(params, { replace: true })
  }

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault()
    updateFilter('search', searchInput.trim())
  }

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setSearchInput('')
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = useCallback((ticket: Ticket) => {
    setEditing(ticket)
    setFormOpen(true)
  }, [])

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteHook.trigger({ id: deleteTarget.id }).result
      toast.success(`Deleted ${deleteTarget.ticket_number}`)
      setDeleteTarget(null)
      loadTickets(filters)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete ticket')
    }
  }

  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.category !== 'all' ||
    filters.assignee !== 'all' ||
    filters.search !== ''

  const loading = ticketsHook.loading

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tickets</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? 'Loading…' : `${tickets.length} ticket${tickets.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" /> New ticket
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search subject or #…"
            className="pl-8 w-56"
          />
        </form>

        <FilterSelect
          value={filters.status}
          onChange={(v) => updateFilter('status', v)}
          placeholder="Status"
          options={STATUSES.map((s) => ({ value: s, label: statusLabel(s) }))}
        />
        <FilterSelect
          value={filters.priority}
          onChange={(v) => updateFilter('priority', v)}
          placeholder="Priority"
          options={PRIORITIES.map((p) => ({ value: p, label: p }))}
        />
        <FilterSelect
          value={filters.category}
          onChange={(v) => updateFilter('category', v)}
          placeholder="Category"
          options={CATEGORIES.map((c) => ({ value: c, label: categoryLabel(c) }))}
        />
        <FilterSelect
          value={filters.assignee}
          onChange={(v) => updateFilter('assignee', v)}
          placeholder="Assignee"
          options={assigneeEmails.map((a) => ({ value: a, label: a }))}
        />

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Content */}
      {loading && tickets.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : ticketsHook.error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          {ticketsHook.error}
        </div>
      ) : tickets.length === 0 ? (
        <Empty className="border rounded-lg py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox />
            </EmptyMedia>
            <EmptyTitle>No tickets found</EmptyTitle>
            <EmptyDescription>
              {hasActiveFilters
                ? 'Try adjusting or clearing your filters.'
                : 'Create your first support ticket to get started.'}
            </EmptyDescription>
          </EmptyHeader>
          {hasActiveFilters ? (
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : (
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1" /> New ticket
            </Button>
          )}
        </Empty>
      ) : (
        <TicketsTable tickets={tickets} onEdit={openEdit} onDelete={setDeleteTarget} />
      )}

      <TicketFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        ticket={editing}
        assigneeEmails={assigneeEmails}
        onSaved={() => loadTickets(filters)}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteTarget?.ticket_number} — "{deleteTarget?.subject}". This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteHook.loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                confirmDelete()
              }}
              disabled={deleteHook.loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  options: { value: string; label: string }[]
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-auto min-w-[130px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {placeholder.toLowerCase()}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
