import type { ReactNode } from 'react'
import { C } from '../../lib/cursor'

type Props = {
  title: string
  subtitle?: string
  children: ReactNode
  loading?: boolean
  empty?: boolean
  emptyLabel?: string
  action?: ReactNode
}

export function ChartCard({ title, subtitle, children, loading, empty, emptyLabel, action }: Props) {
  return (
    <section
      className="rounded-xl border p-4 flex flex-col"
      style={{ backgroundColor: C.surface, borderColor: C.border }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: C.text }}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs" style={{ color: C.muted }}>
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      <div className="flex-1">
        {loading ? (
          <div
            className="h-[260px] w-full animate-pulse rounded-lg"
            style={{ backgroundColor: C.bgSecondary }}
          />
        ) : empty ? (
          <div className="h-[260px] flex items-center justify-center text-sm" style={{ color: C.muted }}>
            {emptyLabel ?? 'No data for this range.'}
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  )
}
