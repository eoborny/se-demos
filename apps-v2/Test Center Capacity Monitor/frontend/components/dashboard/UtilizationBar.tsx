import type { TestCenter } from '../../data/types'
import { flagFor, FLAG_META, utilization } from '../../utils/flagging'

interface UtilizationBarProps {
  center: TestCenter
  showLabel?: boolean
}

export function UtilizationBar({ center, showLabel = true }: UtilizationBarProps) {
  const pct = Math.round(utilization(center) * 100)
  const meta = FLAG_META[flagFor(center)]
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#E7E9EC]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(100, pct)}%`, backgroundColor: meta.dot }}
        />
      </div>
      {showLabel ? (
        <span className="w-20 shrink-0 text-right text-xs tabular-nums text-[#4A5361]">
          {center.seats_booked}/{center.capacity_total}
        </span>
      ) : null}
    </div>
  )
}
