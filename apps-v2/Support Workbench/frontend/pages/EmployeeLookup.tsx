import { useEffect, useState, type ReactNode } from 'react'
import { Search, Plus } from 'lucide-react'
import { Input } from '../lib/shadcn/input'
import { useSearchEmployees, useGetEmployeeTickets } from '../hooks/backend/support'
import { C } from '../lib/cursor'
import { useWorkbench } from '../lib/workbench'
import type { EmployeeRow, TicketListRow } from '../lib/types'
import { MiniTicketList } from '../components/MiniTicketList'

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-xs" style={{ color: C.muted }}>
        {label}
      </span>
      <span className="text-sm text-right font-medium" style={{ color: C.text }}>
        {value || '—'}
      </span>
    </div>
  )
}

export default function EmployeeLookup() {
  const { openTicket, openNewTicket, dataVersion } = useWorkbench()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<EmployeeRow | null>(null)

  const searchFn = useSearchEmployees()
  const ticketsFn = useGetEmployeeTickets()

  useEffect(() => {
    void searchFn.trigger({ query }, { skipCache: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, dataVersion])

  useEffect(() => {
    if (selected) void ticketsFn.trigger({ employeeId: selected.id }, { skipCache: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, dataVersion])

  const employees = (searchFn.data as EmployeeRow[] | undefined) ?? []
  const tickets = (ticketsFn.data as TicketListRow[] | undefined) ?? []

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: C.text }}>
          Employee Lookup
        </h1>
        <p className="text-sm" style={{ color: C.muted }}>
          Search by email or name.
        </p>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: C.muted }} />
        <Input
          aria-label="Search employees"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search employees…"
          className="pl-9"
          style={{ backgroundColor: C.surface, borderColor: C.border, color: C.text }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Results */}
        <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: C.surface, borderColor: C.border }}>
          <div className="px-4 py-2 border-b text-xs font-semibold uppercase tracking-wide" style={{ borderColor: C.border, color: C.muted }}>
            {searchFn.loading ? 'Searching…' : `${employees.length} employees`}
          </div>
          <div className="max-h-[60vh] overflow-y-auto cursor-scroll divide-y" style={{ borderColor: C.border }}>
            {employees.map((emp) => {
              const active = selected?.id === emp.id
              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => setSelected(emp)}
                  className="w-full text-left px-4 py-3 transition-colors"
                  style={{ backgroundColor: active ? 'rgba(83,58,253,0.06)' : undefined }}
                >
                  <div className="text-sm font-medium" style={{ color: C.text }}>
                    {emp.name}
                  </div>
                  <div className="text-xs" style={{ color: C.muted }}>
                    {emp.email} · {emp.department ?? '—'} · {emp.location ?? '—'}
                  </div>
                </button>
              )
            })}
            {!searchFn.loading && employees.length === 0 && (
              <div className="px-4 py-6 text-sm" style={{ color: C.muted }}>
                No employees found.
              </div>
            )}
          </div>
        </div>

        {/* Profile */}
        <div className="rounded-xl border p-4" style={{ backgroundColor: C.surface, borderColor: C.border }}>
          {selected ? (
            <>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: C.text }}>
                    {selected.name}
                  </h2>
                  <p className="text-sm" style={{ color: C.muted }}>
                    {selected.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    openNewTicket({
                      ticketType: 'internal',
                      employeeId: selected.id,
                      employeeLabel: selected.name,
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white"
                  style={{ backgroundColor: C.orange }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create Ticket
                </button>
              </div>
              <div className="rounded-lg border p-3 mb-4" style={{ backgroundColor: C.bgSecondary, borderColor: C.border }}>
                <InfoRow label="Department" value={selected.department} />
                <InfoRow label="Manager" value={selected.manager_email} />
                <InfoRow label="Location" value={selected.location} />
              </div>
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>
                Ticket history
              </h3>
              <MiniTicketList
                tickets={tickets}
                loading={ticketsFn.loading}
                onRowClick={openTicket}
                emptyLabel="No tickets for this employee."
              />
            </>
          ) : (
            <div className="text-sm py-10 text-center" style={{ color: C.muted }}>
              Select an employee to view their profile and ticket history.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
