import type { TestCenter } from '../data/types'
import { flagFor, FLAG_META, utilization } from './flagging'

const COLUMNS: Array<{ header: string; value: (c: TestCenter) => string | number }> = [
  { header: 'Center ID', value: (c) => c.center_id },
  { header: 'Center Name', value: (c) => c.center_name },
  { header: 'City', value: (c) => c.city },
  { header: 'State', value: (c) => c.state },
  { header: 'Country', value: (c) => c.country },
  { header: 'Program', value: (c) => c.test_program },
  { header: 'Capacity', value: (c) => c.capacity_total },
  { header: 'Seats Booked', value: (c) => c.seats_booked },
  { header: 'Utilization %', value: (c) => Math.round(utilization(c) * 100) },
  { header: 'Session Date', value: (c) => c.session_date },
  { header: 'Session Time', value: (c) => c.session_time },
  { header: 'Proctors', value: (c) => c.proctor_count },
  { header: 'Proctors Required', value: (c) => c.proctor_required },
  { header: 'Status', value: (c) => c.status },
  { header: 'Flag', value: (c) => FLAG_META[flagFor(c)].label },
]

function escapeCell(value: string | number): string {
  const s = String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function exportCentersCsv(centers: TestCenter[]): void {
  const rows = [
    COLUMNS.map((c) => escapeCell(c.header)).join(','),
    ...centers.map((center) =>
      COLUMNS.map((col) => escapeCell(col.value(center))).join(','),
    ),
  ]
  const csv = rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  link.href = url
  link.download = `test-center-capacity-${stamp}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
