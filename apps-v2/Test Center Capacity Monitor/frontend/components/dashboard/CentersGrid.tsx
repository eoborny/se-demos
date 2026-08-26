import { Calendar, MapPin, UserCheck } from 'lucide-react'
import type { TestCenter } from '../../data/types'
import { daysUntilSession, flagFor, FLAG_META, utilization } from '../../utils/flagging'
import { StatusBadge } from './StatusBadge'
import { UtilizationBar } from './UtilizationBar'

interface CentersGridProps {
  centers: TestCenter[]
  onSelect: (center: TestCenter) => void
  selectedId?: string | undefined
}

export function CentersGrid({ centers, onSelect, selectedId }: CentersGridProps) {
  if (centers.length === 0) {
    return (
      <div className="rounded-md border border-[#E4E6E9] bg-white p-10 text-center text-sm text-[#9AA1AB] shadow-retool-sm">
        No centers match the current filters.
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {centers.map((c) => {
        const flag = flagFor(c)
        const meta = FLAG_META[flag]
        const days = daysUntilSession(c)
        const understaffed = c.proctor_count < c.proctor_required
        return (
          <button
            key={c.center_id}
            onClick={() => onSelect(c)}
            className={
              'group relative overflow-hidden rounded-md border bg-white p-4 text-left shadow-retool-sm transition-all hover:shadow-retool-md ' +
              (selectedId === c.center_id ? 'border-[#F2B733]' : 'border-[#E4E6E9]')
            }
          >
            <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: meta.dot }} />
            <div className="flex items-start justify-between gap-2 pl-1">
              <div>
                <h3 className="font-semibold leading-tight text-[#1A212B]">{c.center_name}</h3>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-[#6B7280]">
                  <MapPin className="h-3 w-3" />
                  {c.city}, {c.state}
                </p>
              </div>
              <StatusBadge flag={flag} size="sm" />
            </div>

            <div className="mt-3 pl-1">
              <div className="mb-1 flex items-center justify-between text-xs text-[#6B7280]">
                <span className="rounded-sm bg-[#F0F1F3] px-1.5 py-0.5 font-medium text-[#4A5361]">
                  {c.test_program}
                </span>
                <span className="tabular-nums font-medium text-[#1A212B]">
                  {Math.round(utilization(c) * 100)}%
                </span>
              </div>
              <UtilizationBar center={c} />
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-[#EEF0F2] pt-2.5 pl-1 text-xs text-[#6B7280]">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(c.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                <span className="text-[#9AA1AB]">
                  ({days < 0 ? 'past' : days === 0 ? 'today' : `${days}d`})
                </span>
              </span>
              <span
                className={
                  'flex items-center gap-1 ' + (understaffed ? 'font-semibold text-[#B0463C]' : '')
                }
              >
                <UserCheck className="h-3.5 w-3.5" />
                {c.proctor_count}/{c.proctor_required}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
