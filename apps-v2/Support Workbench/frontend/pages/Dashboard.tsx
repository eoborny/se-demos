import { useEffect, useState } from 'react'
import { Building2, Users } from 'lucide-react'
import { useGetTickets, useGetKPIs, useGetFilterOptions } from '../hooks/backend/support'
import { KpiCards } from '../components/KpiCards'
import { FilterMenu, DEFAULT_FILTERS, type TicketFilters } from '../components/FilterMenu'
import { TicketTable } from '../components/TicketTable'
import { C } from '../lib/cursor'
import { useWorkbench } from '../lib/workbench'
import type { KPIs, TicketRow } from '../lib/types'

export default function Dashboard() {
  const { openTicket, openNewTicket, selectedTicketId, dataVersion } = useWorkbench()
  const [filters, setFilters] = useState<TicketFilters>(DEFAULT_FILTERS)

  const ticketsFn = useGetTickets()
  const kpisFn = useGetKPIs()
  const optionsFn = useGetFilterOptions()

  useEffect(() => {
    void kpisFn.trigger({}, { skipCache: true })
    void optionsFn.trigger({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataVersion])

  useEffect(() => {
    void ticketsFn.trigger(
      {
        ticketType: filters.ticketType,
        status: filters.status,
        priority: filters.priority,
        assignee: filters.assignee,
        category: filters.category,
      },
      { skipCache: true },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, dataVersion])

  const kpis = (kpisFn.data as KPIs | null) ?? null
  const tickets = (ticketsFn.data as TicketRow[] | undefined) ?? []
  const assignees = ((optionsFn.data as { assignees?: string[] } | undefined)?.assignees) ?? []

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: C.text }}>
          Cursor Support Workbench
        </h1>
        <p className="text-sm" style={{ color: C.muted }}>
          Triage, resolve, and track external and internal support tickets.
        </p>
      </div>

      <KpiCards kpis={kpis} loading={kpisFn.loading} />

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="text-sm font-medium" style={{ color: C.muted }}>
          {ticketsFn.loading ? 'Loading tickets…' : `${tickets.length} ticket${tickets.length === 1 ? '' : 's'}`}
        </span>
        <div className="flex items-center gap-2">
          <FilterMenu filters={filters} onChange={setFilters} assignees={assignees} />
          <button
            type="button"
            onClick={() => openNewTicket({ ticketType: 'external' })}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: C.orange }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.orangeHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.orange)}
          >
            <Building2 className="h-4 w-4" />
            New External Ticket
          </button>
          <button
            type="button"
            onClick={() => openNewTicket({ ticketType: 'internal' })}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border transition-colors"
            style={{ backgroundColor: C.surface, borderColor: C.border, color: C.text }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.bgSecondary)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = C.surface)}
          >
            <Users className="h-4 w-4" />
            New Internal Ticket
          </button>
        </div>
      </div>

      {/* Full-width table */}
      {ticketsFn.error ? (
        <div
          className="rounded-xl border p-4 text-sm"
          style={{ backgroundColor: C.surface, borderColor: C.border, color: C.error }}
        >
          Failed to load tickets: {ticketsFn.error}
        </div>
      ) : (
        <TicketTable
          tickets={tickets}
          loading={ticketsFn.loading && tickets.length === 0}
          onRowClick={openTicket}
          selectedId={selectedTicketId}
        />
      )}
    </div>
  )
}
