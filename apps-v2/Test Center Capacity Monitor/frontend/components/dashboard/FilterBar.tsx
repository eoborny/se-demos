import { Download, LayoutGrid, Search, Table2, X } from 'lucide-react'
import type { FlagLevel, TestProgram } from '../../data/types'
import { Input } from '../../lib/shadcn/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../lib/shadcn/select'

export interface Filters {
  search: string
  program: 'all' | TestProgram
  region: string
  status: 'all' | FlagLevel
  dateRange: 'all' | '7' | '14' | '30'
}

export type ViewMode = 'table' | 'grid'

interface FilterBarProps {
  filters: Filters
  onChange: (next: Filters) => void
  regions: string[]
  view: ViewMode
  onViewChange: (view: ViewMode) => void
  onExport: () => void
  resultCount: number
}

const PROGRAMS: TestProgram[] = ['TOEFL', 'GRE', 'Praxis', 'TOEIC']

export function FilterBar({
  filters,
  onChange,
  regions,
  view,
  onViewChange,
  onExport,
  resultCount,
}: FilterBarProps) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })
  const isFiltered =
    filters.search !== '' ||
    filters.program !== 'all' ||
    filters.region !== 'all' ||
    filters.status !== 'all' ||
    filters.dateRange !== 'all'

  return (
    <div className="rounded-md border border-[#E4E6E9] bg-white p-3 shadow-retool-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA1AB]" />
          <Input
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Search center, city, or ID"
            className="h-9 border-[#DcdfE3] pl-9"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:flex-1">
          <Select value={filters.program} onValueChange={(v) => set({ program: v as Filters['program'] })}>
            <SelectTrigger className="h-9 border-[#DcdfE3] bg-white lg:w-[130px]">
              <SelectValue placeholder="Program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {PROGRAMS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.region} onValueChange={(v) => set({ region: v })}>
            <SelectTrigger className="h-9 border-[#DcdfE3] bg-white lg:w-[120px]">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {regions.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={(v) => set({ status: v as Filters['status'] })}>
            <SelectTrigger className="h-9 border-[#DcdfE3] bg-white lg:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="overbooked">Overbooked Risk</SelectItem>
              <SelectItem value="underbooked">Underbooked</SelectItem>
              <SelectItem value="healthy">Healthy</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.dateRange} onValueChange={(v) => set({ dateRange: v as Filters['dateRange'] })}>
            <SelectTrigger className="h-9 border-[#DcdfE3] bg-white lg:w-[140px]">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any date</SelectItem>
              <SelectItem value="7">Next 7 days</SelectItem>
              <SelectItem value="14">Next 14 days</SelectItem>
              <SelectItem value="30">Next 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {isFiltered ? (
            <button
              onClick={() =>
                onChange({ search: '', program: 'all', region: 'all', status: 'all', dateRange: 'all' })
              }
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-[#6B7280] transition-colors hover:bg-[#F0F1F3] hover:text-[#1A212B]"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          ) : null}

          <div className="flex overflow-hidden rounded-md border border-[#DcdfE3]">
            <button
              onClick={() => onViewChange('table')}
              aria-label="Table view"
              className={
                'flex h-9 w-9 items-center justify-center transition-colors ' +
                (view === 'table' ? 'bg-[#1A212B] text-white' : 'bg-white text-[#6B7280] hover:bg-[#F0F1F3]')
              }
            >
              <Table2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewChange('grid')}
              aria-label="Grid view"
              className={
                'flex h-9 w-9 items-center justify-center transition-colors ' +
                (view === 'grid' ? 'bg-[#1A212B] text-white' : 'bg-white text-[#6B7280] hover:bg-[#F0F1F3]')
              }
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={onExport}
            className="flex h-9 items-center gap-2 rounded-md border border-[#DcdfE3] bg-white px-3 text-sm font-medium text-[#1A212B] transition-colors hover:bg-[#F0F1F3]"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      <p className="mt-2 text-xs text-[#6B7280]">
        Showing <span className="font-semibold text-[#1A212B]">{resultCount}</span> center
        {resultCount === 1 ? '' : 's'}
      </p>
    </div>
  )
}
