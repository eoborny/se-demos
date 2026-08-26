import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { TestCenter } from '../../data/types'
import { daysUntilSession, flagFor, utilization } from '../../utils/flagging'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../lib/shadcn/table'
import { StatusBadge } from './StatusBadge'
import { UtilizationBar } from './UtilizationBar'

type SortKey = 'name' | 'program' | 'location' | 'utilization' | 'session' | 'proctors' | 'flag'
type SortDir = 'asc' | 'desc'

interface CentersTableProps {
  centers: TestCenter[]
  onSelect: (center: TestCenter) => void
  selectedId?: string | undefined
}

const FLAG_ORDER = { overbooked: 0, underbooked: 1, healthy: 2 } as const

function sortValue(c: TestCenter, key: SortKey): number | string {
  switch (key) {
    case 'name':
      return c.center_name.toLowerCase()
    case 'program':
      return c.test_program
    case 'location':
      return `${c.state} ${c.city}`.toLowerCase()
    case 'utilization':
      return utilization(c)
    case 'session':
      return c.session_date
    case 'proctors':
      return c.proctor_count - c.proctor_required
    case 'flag':
      return FLAG_ORDER[flagFor(c)]
  }
}

export function CentersTable({ centers, onSelect, selectedId }: CentersTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('flag')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const sorted = useMemo(() => {
    const copy = [...centers]
    copy.sort((a, b) => {
      const av = sortValue(a, sortKey)
      const bv = sortValue(b, sortKey)
      let cmp = 0
      if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv
      else cmp = String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [centers, sortKey, sortDir])

  const toggle = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const header = (key: SortKey, label: string, align: 'left' | 'right' = 'left') => (
    <TableHead
      className={
        'cursor-pointer select-none whitespace-nowrap text-[#4A5361] hover:text-[#1A212B] ' +
        (align === 'right' ? 'text-right' : '')
      }
      onClick={() => toggle(key)}
    >
      <span className={'inline-flex items-center gap-1 ' + (align === 'right' ? 'flex-row-reverse' : '')}>
        {label}
        {sortKey === key ? (
          sortDir === 'asc' ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ChevronsUpDown className="h-3 w-3 opacity-40" />
        )}
      </span>
    </TableHead>
  )

  return (
    <div className="overflow-hidden rounded-md border border-[#E4E6E9] bg-white shadow-retool-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-[#E4E6E9] bg-[#F7F8F9] hover:bg-[#F7F8F9]">
            {header('name', 'Center')}
            {header('program', 'Program')}
            {header('location', 'Location')}
            {header('utilization', 'Utilization')}
            {header('session', 'Session')}
            {header('proctors', 'Proctors', 'right')}
            {header('flag', 'Status', 'right')}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((c) => {
            const days = daysUntilSession(c)
            const understaffed = c.proctor_count < c.proctor_required
            return (
              <TableRow
                key={c.center_id}
                onClick={() => onSelect(c)}
                className={
                  'cursor-pointer border-[#EEF0F2] transition-colors hover:bg-[#F7F8F9] ' +
                  (selectedId === c.center_id ? 'bg-[#FBF4E3]' : '')
                }
              >
                <TableCell className="py-2.5">
                  <div className="font-medium text-[#1A212B]">{c.center_name}</div>
                  <div className="text-xs text-[#9AA1AB]">{c.center_id}</div>
                </TableCell>
                <TableCell className="text-[#4A5361]">{c.test_program}</TableCell>
                <TableCell className="whitespace-nowrap text-[#4A5361]">
                  {c.city}, {c.state}
                </TableCell>
                <TableCell className="w-[180px] min-w-[160px]">
                  <UtilizationBar center={c} />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <div className="text-[#1A212B]">
                    {new Date(c.session_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="text-xs text-[#9AA1AB]">
                    {days < 0 ? 'past' : days === 0 ? 'today' : `in ${days}d`} · {c.session_time}
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <span className={understaffed ? 'font-semibold text-[#B0463C]' : 'text-[#4A5361]'}>
                    {c.proctor_count}/{c.proctor_required}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <StatusBadge flag={flagFor(c)} size="sm" />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      {sorted.length === 0 ? (
        <div className="p-10 text-center text-sm text-[#9AA1AB]">
          No centers match the current filters.
        </div>
      ) : null}
    </div>
  )
}
