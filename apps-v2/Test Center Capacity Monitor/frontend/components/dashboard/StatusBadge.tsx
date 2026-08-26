import type { FlagLevel } from '../../data/types'
import { FLAG_META } from '../../utils/flagging'

interface StatusBadgeProps {
  flag: FlagLevel
  size?: 'sm' | 'md'
}

export function StatusBadge({ flag, size = 'md' }: StatusBadgeProps) {
  const meta = FLAG_META[flag]
  return (
    <span
      className={
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm font-medium ' +
        (size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs')
      }
      style={{ backgroundColor: meta.bg, color: meta.text, border: `1px solid ${meta.border}` }}
    >
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: meta.dot }}
      />
      {meta.label}
    </span>
  )
}
