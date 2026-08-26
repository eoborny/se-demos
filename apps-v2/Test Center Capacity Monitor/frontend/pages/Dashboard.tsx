import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AppHeader } from '../components/dashboard/AppHeader'
import { CenterDetailDrawer } from '../components/dashboard/CenterDetailDrawer'
import { CentersGrid } from '../components/dashboard/CentersGrid'
import { CentersTable } from '../components/dashboard/CentersTable'
import { FilterBar, type Filters, type ViewMode } from '../components/dashboard/FilterBar'
import { StatusBadge } from '../components/dashboard/StatusBadge'
import { SummaryHeader } from '../components/dashboard/SummaryHeader'
import type { CenterNote, TestCenter } from '../data/types'
import { useCenterDetail, useCenters } from '../hooks/useCenterMonitor'
import { daysUntilSession, flagFor, isAtRisk } from '../utils/flagging'
import { exportCentersCsv } from '../utils/csv'

const DEFAULT_FILTERS: Filters = {
  search: '',
  program: 'all',
  region: 'all',
  status: 'all',
  dateRange: 'all',
}

export default function Dashboard() {
  const { centers, loading, error, reload } = useCenters()
  const { detail, loading: detailLoading, saving, load, addNote } = useCenterDetail()

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [view, setView] = useState<ViewMode>('table')
  const [selected, setSelected] = useState<TestCenter | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const regions = useMemo(
    () => Array.from(new Set(centers.map((c) => c.state))).sort(),
    [centers],
  )

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    return centers.filter((c) => {
      if (q) {
        const hay = `${c.center_name} ${c.city} ${c.state} ${c.center_id}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (filters.program !== 'all' && c.test_program !== filters.program) return false
      if (filters.region !== 'all' && c.state !== filters.region) return false
      if (filters.status !== 'all' && flagFor(c) !== filters.status) return false
      if (filters.dateRange !== 'all') {
        const days = daysUntilSession(c)
        const limit = Number(filters.dateRange)
        if (days < 0 || days > limit) return false
      }
      return true
    })
  }, [centers, filters])

  const atRisk = useMemo(() => filtered.filter(isAtRisk), [filtered])

  const openCenter = (center: TestCenter) => {
    setSelected(center)
    setDrawerOpen(true)
    void load(center.center_id)
  }

  const handleAddNote = (note: Omit<CenterNote, 'id' | 'timestamp'>) => {
    void addNote({ centerId: note.centerId, kind: note.kind, text: note.text })
  }

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <AppHeader />

      <main className="mx-auto max-w-[1400px] space-y-4 px-4 py-5 sm:px-6">
        {error ? (
          <div className="flex items-center justify-between rounded-md border border-[#E9C4C0] bg-[#FBEDEB] p-3">
            <div className="flex items-center gap-2 text-sm text-[#8F3A31]">
              <AlertTriangle className="h-4 w-4" />
              Failed to load test centers: {error}
            </div>
            <button
              onClick={reload}
              className="flex items-center gap-1.5 rounded-md border border-[#E9C4C0] bg-white px-2.5 py-1.5 text-xs font-medium text-[#8F3A31] hover:bg-[#FBEDEB]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        ) : null}

        {loading && centers.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-md border border-[#E4E6E9] bg-white text-[#9AA1AB]">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading test centers…
          </div>
        ) : (
          <>
            <SummaryHeader centers={filtered} />

            {atRisk.length > 0 ? (
              <div className="rounded-md border border-[#F0D9A6] bg-[#FCF7EA] p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-[#9A7015]" />
                  <h2 className="text-sm font-semibold text-[#1A212B]">
                    {atRisk.length} center{atRisk.length === 1 ? '' : 's'} need attention
                  </h2>
                </div>
                <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                  {atRisk.map((c) => (
                    <button
                      key={c.center_id}
                      onClick={() => openCenter(c)}
                      className="flex shrink-0 items-center gap-2 rounded-md border border-[#E4E6E9] bg-white px-3 py-1.5 text-left text-xs shadow-retool-sm transition-colors hover:bg-[#F7F8F9]"
                    >
                      <StatusBadge flag={flagFor(c)} size="sm" />
                      <span className="font-medium text-[#1A212B]">{c.center_name}</span>
                      <span className="text-[#9AA1AB]">
                        {c.seats_booked}/{c.capacity_total}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <FilterBar
              filters={filters}
              onChange={setFilters}
              regions={regions}
              view={view}
              onViewChange={setView}
              onExport={() => exportCentersCsv(filtered)}
              resultCount={filtered.length}
            />

            {view === 'table' ? (
              <CentersTable centers={filtered} onSelect={openCenter} selectedId={selected?.center_id} />
            ) : (
              <CentersGrid centers={filtered} onSelect={openCenter} selectedId={selected?.center_id} />
            )}
          </>
        )}
      </main>

      <CenterDetailDrawer
        center={selected}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        detail={detail}
        detailLoading={detailLoading}
        saving={saving}
        onAddNote={handleAddNote}
      />
    </div>
  )
}
