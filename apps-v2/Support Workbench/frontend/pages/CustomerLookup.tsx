import { useEffect, useState, type ReactNode } from 'react'
import { Search, Plus } from 'lucide-react'
import { Input } from '../lib/shadcn/input'
import { useSearchCustomers, useGetCustomerTickets } from '../hooks/backend/support'
import { C } from '../lib/cursor'
import { useWorkbench } from '../lib/workbench'
import type { CustomerRow, TicketListRow } from '../lib/types'
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

export default function CustomerLookup() {
  const { openTicket, openNewTicket, dataVersion } = useWorkbench()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<CustomerRow | null>(null)

  const searchFn = useSearchCustomers()
  const ticketsFn = useGetCustomerTickets()

  useEffect(() => {
    void searchFn.trigger({ query }, { skipCache: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, dataVersion])

  useEffect(() => {
    if (selected) void ticketsFn.trigger({ customerId: selected.id }, { skipCache: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, dataVersion])

  const customers = (searchFn.data as CustomerRow[] | undefined) ?? []
  const tickets = (ticketsFn.data as TicketListRow[] | undefined) ?? []

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: C.text }}>
          Customer Lookup
        </h1>
        <p className="text-sm" style={{ color: C.muted }}>
          Search by email, account ID, or company.
        </p>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: C.muted }} />
        <Input
          aria-label="Search customers"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search customers…"
          className="pl-9"
          style={{ backgroundColor: C.surface, borderColor: C.border, color: C.text }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Results */}
        <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: C.surface, borderColor: C.border }}>
          <div className="px-4 py-2 border-b text-xs font-semibold uppercase tracking-wide" style={{ borderColor: C.border, color: C.muted }}>
            {searchFn.loading ? 'Searching…' : `${customers.length} customers`}
          </div>
          <div className="max-h-[60vh] overflow-y-auto cursor-scroll divide-y" style={{ borderColor: C.border }}>
            {customers.map((c) => {
              const active = selected?.id === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelected(c)}
                  className="w-full text-left px-4 py-3 transition-colors"
                  style={{ backgroundColor: active ? 'rgba(83,58,253,0.06)' : undefined }}
                >
                  <div className="text-sm font-medium" style={{ color: C.text }}>
                    {c.name}
                  </div>
                  <div className="text-xs" style={{ color: C.muted }}>
                    {c.email} · {c.company ?? '—'} · {c.plan_tier ?? '—'}
                  </div>
                </button>
              )
            })}
            {!searchFn.loading && customers.length === 0 && (
              <div className="px-4 py-6 text-sm" style={{ color: C.muted }}>
                No customers found.
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
                      ticketType: 'external',
                      customerId: selected.id,
                      customerLabel: selected.name,
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
                <InfoRow label="Company" value={selected.company} />
                <InfoRow label="Plan tier" value={selected.plan_tier} />
                <InfoRow label="Account ID" value={selected.account_id} />
                <InfoRow label="Stripe ID" value={selected.stripe_customer_id} />
                {selected.notes && <InfoRow label="Notes" value={selected.notes} />}
              </div>
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.muted }}>
                Ticket history
              </h3>
              <MiniTicketList
                tickets={tickets}
                loading={ticketsFn.loading}
                onRowClick={openTicket}
                emptyLabel="No tickets for this customer."
              />
            </>
          ) : (
            <div className="text-sm py-10 text-center" style={{ color: C.muted }}>
              Select a customer to view their profile and ticket history.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
