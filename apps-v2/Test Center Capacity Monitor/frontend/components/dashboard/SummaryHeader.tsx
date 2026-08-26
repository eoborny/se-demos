import { AlertTriangle, Building2, TrendingDown, Users } from 'lucide-react'
import type { TestCenter } from '../../data/types'
import { flagFor } from '../../utils/flagging'

interface SummaryHeaderProps {
  centers: TestCenter[]
}

interface Stat {
  label: string
  value: string
  sub: string
  icon: React.ReactNode
  accent?: boolean
  tone?: 'red' | 'gold'
}

export function SummaryHeader({ centers }: SummaryHeaderProps) {
  const totalBooked = centers.reduce((s, c) => s + c.seats_booked, 0)
  const totalCapacity = centers.reduce((s, c) => s + c.capacity_total, 0)
  const bookedPct = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0
  const overbooked = centers.filter((c) => flagFor(c) === 'overbooked').length
  const underbooked = centers.filter((c) => flagFor(c) === 'underbooked').length

  const stats: Stat[] = [
    {
      label: 'Centers Monitored',
      value: String(centers.length),
      sub: `${new Set(centers.map((c) => `${c.city}, ${c.state}`)).size} locations`,
      icon: <Building2 className="h-5 w-5" />,
    },
    {
      label: 'Seats Booked',
      value: totalBooked.toLocaleString(),
      sub: `of ${totalCapacity.toLocaleString()} available · ${bookedPct}% filled`,
      icon: <Users className="h-5 w-5" />,
      accent: true,
    },
    {
      label: 'Overbooked Risk',
      value: String(overbooked),
      sub: 'at or above 95% capacity',
      icon: <AlertTriangle className="h-5 w-5" />,
      tone: 'red',
    },
    {
      label: 'Underbooked',
      value: String(underbooked),
      sub: 'under 25% within 7 days',
      icon: <TrendingDown className="h-5 w-5" />,
      tone: 'gold',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="relative overflow-hidden rounded-md border border-[#E4E6E9] bg-white p-4 shadow-retool-sm"
        >
          {s.accent ? (
            <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: '#F2B733' }} />
          ) : null}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                {s.label}
              </p>
              <p
                className="mt-2 text-3xl font-semibold tabular-nums"
                style={{
                  color:
                    s.tone === 'red' ? '#B0463C' : s.tone === 'gold' ? '#9A7015' : '#1A212B',
                }}
              >
                {s.value}
              </p>
              <p className="mt-1 text-xs text-[#6B7280]">{s.sub}</p>
            </div>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-md"
              style={{
                backgroundColor:
                  s.tone === 'red'
                    ? 'rgba(192, 86, 75, 0.12)'
                    : s.tone === 'gold'
                      ? 'rgba(212, 160, 41, 0.14)'
                      : 'rgba(26, 33, 43, 0.06)',
                color: s.tone === 'red' ? '#B0463C' : s.tone === 'gold' ? '#9A7015' : '#1A212B',
              }}
            >
              {s.icon}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
