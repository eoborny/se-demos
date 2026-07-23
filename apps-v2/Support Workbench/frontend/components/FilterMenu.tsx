import { useState, type ReactNode } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '../lib/shadcn/popover'
import { NativeSelect } from '../lib/shadcn/native-select'
import { Label } from '../lib/shadcn/label'
import { ALL_CATEGORIES, ALL_PRIORITIES, ALL_STATUSES, C, statusLabel } from '../lib/cursor'

export type TicketFilters = {
  ticketType: string
  status: string
  priority: string
  assignee: string
  category: string
}

export const DEFAULT_FILTERS: TicketFilters = {
  ticketType: 'All',
  status: 'All',
  priority: 'All',
  assignee: 'All',
  category: 'All',
}

export function activeFilterCount(filters: TicketFilters): number {
  return (Object.keys(filters) as (keyof TicketFilters)[]).reduce(
    (n, k) => (filters[k] !== DEFAULT_FILTERS[k] ? n + 1 : n),
    0,
  )
}

function FieldSelect({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium" style={{ color: C.muted }}>
        {label}
      </Label>
      <NativeSelect
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ backgroundColor: C.surface, borderColor: C.border, color: C.text }}
      >
        {children}
      </NativeSelect>
    </div>
  )
}

type Props = {
  filters: TicketFilters
  onChange: (next: TicketFilters) => void
  assignees: string[]
}

export function FilterMenu({ filters, onChange, assignees }: Props) {
  const [open, setOpen] = useState(false)
  const count = activeFilterCount(filters)
  const set = (patch: Partial<TicketFilters>) => onChange({ ...filters, ...patch })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={count > 0 ? `Filters, ${count} active` : 'Filters'}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border transition-colors"
          style={{ backgroundColor: C.surface, borderColor: C.border, color: C.text }}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {count > 0 && (
            <span
              className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold text-white"
              style={{ backgroundColor: C.orange }}
            >
              {count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 space-y-3"
        style={{ backgroundColor: C.surface, borderColor: C.border }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: C.text }}>
            Filter tickets
          </h3>
          {count > 0 && (
            <button
              type="button"
              onClick={() => onChange(DEFAULT_FILTERS)}
              className="inline-flex items-center gap-1 text-xs font-medium"
              style={{ color: C.orange }}
            >
              <X className="h-3 w-3" />
              Clear all filters
            </button>
          )}
        </div>

        <FieldSelect id="f-type" label="Type" value={filters.ticketType} onChange={(v) => set({ ticketType: v })}>
          <option value="All">All</option>
          <option value="external">External</option>
          <option value="internal">Internal</option>
        </FieldSelect>

        <FieldSelect id="f-status" label="Status" value={filters.status} onChange={(v) => set({ status: v })}>
          <option value="All">All</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </FieldSelect>

        <FieldSelect id="f-priority" label="Priority" value={filters.priority} onChange={(v) => set({ priority: v })}>
          <option value="All">All</option>
          {ALL_PRIORITIES.map((pr) => (
            <option key={pr} value={pr}>
              {pr}
            </option>
          ))}
        </FieldSelect>

        <FieldSelect id="f-assignee" label="Assignee" value={filters.assignee} onChange={(v) => set({ assignee: v })}>
          <option value="All">All</option>
          {assignees.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </FieldSelect>

        <FieldSelect id="f-category" label="Category" value={filters.category} onChange={(v) => set({ category: v })}>
          <option value="All">All</option>
          {ALL_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </FieldSelect>
      </PopoverContent>
    </Popover>
  )
}
